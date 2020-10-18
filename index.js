/**
 * @file index.js -- AWS Lambda function in Node.js
 * This function receives a DocuSign Connect notification message
 * and enqueues it to a SQS queue.
 * 
 * Environment variables
 * BASIC_AUTH_NAME  -- used to enforce basic authentication for the function's url
 * BASIC_AUTH_PW
 * HMAC_1 -- the HMAC secret for HMAC signature 1. Can be omitted if HMAC not configured
 * QUEUE_URL
 * QUEUE_REGION -- eg 'us-east-2'
 * MESSAGE_GROUP_ID -- eg 1. ONLY set this environment variable for FIFO queues! 
 * 
 * References
 */

const crypto = require('crypto')
    , AWS = require('aws-sdk')
    ;

const debug = true;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

exports.handler = async (event, context) => {

    const debugLog = msg => {if (debug) {console.log(msg)}};
    const requestId = context.awsRequestId;

    function checkBasicAuth() {
        const name = process.env['BASIC_AUTH_NAME']
            , pw = process.env['BASIC_AUTH_PW']
            , authRaw0 = (event.headers && event.headers.Authorization) || (event.headers && event.headers.authorization) || ''
            , authRaw = authRaw0.split(' ')[1]  || ''
            , authString = Buffer.from(authRaw, 'base64').toString()
            , authArray = authString.split(':')
            , authenticated = name == authArray[0] && pw == authArray[1]
            ;
        
        if (!authenticated && debug) {
            console.log  (`Authentication error. Authentication header: ${authRaw0} `)
        }
        return authenticated
    }

    debugLog(`Started!. Request ID: ${requestId}`);
    // Check Basic Authentication 
    if (checkBasicAuth()) {
        debugLog("Authenticated!")
    } else {
        const response = {statusCode: 401, body: `Unauthorized! Please include the BASIC AUTHENTICATION header.`}
        // Note that the user will not be asked to authenticate because returning
        // the necessary headers to enable that requires an API Gateway lambda.
        // For our use case, Connect should be properly configured to send 
        // the Basic Authentication header in the first place.
        return response // EARLY return  
    }

    // Check HMAC and enqueue. Allow for test messages
    const test = (event.queryStringParameters && event.queryStringParameters.test) ? 
                    event.queryStringParameters.test : false
        , rawXML = event.body
        , hmac1 = process.env['HMAC_1']
        , hmacConfigured = hmac1;

    let hmacPassed;
    if (!test && hmacConfigured) {
        // Not a test:
        // Step 1. Check the HMAC
        // get the headers
        const authDigest = event.headers['X-Authorization-Digest']
            , accountIdHeader = event.headers['X-DocuSign-AccountId']
            , hmacSig1 = event.headers['X-DocuSign-Signature-1']
            ;
        hmacPassed = checkHmac(hmac1, rawXML, authDigest, accountIdHeader, hmacSig1)
        if (!hmacPassed) {
            console.error(`${new Date().toUTCString()} HMAC did not pass!!`);
            console.error(`Header values: ${JSON.stringify(event.headers, null, 4)}`);
            const response = {statusCode: 412, body: `HMAC did not pass!`}
            return response // EARLY return    
        }
    } else {
        // hmac is not configured or a test message. HMAC is not checked for tests.
        hmacPassed = true
    }

    let response; 
    if (test || hmacPassed) {
        // Step 2. Store in queue
        let  error = await enqueue (rawXML, test);
        if (error) {
            debugLog (`Error while enqueuing: ${error}`);
            // Wait 5 sec and then try again
            await sleep(5000);
            error = await enqueue (rawXML, test);
        }
        if (error) {
            response = {statusCode: 400, body: `Problem! ${error}`}
            console.log(`${new Date().toUTCString()} Enqueue error: ${error}`);
        } else {
            // Success!
            response = {statusCode: 200, body: 'enqueued'}
            if (test) {
                debugLog (`${new Date().toUTCString()} Enqueued a test notification: ${test}`)
            } else {
                debugLog (`${new Date().toUTCString()} Enqueued a notification`)
            }
        }
    } 
    return response;
};

/**
* 
* @param {string} key1: The HMAC key for signature 1
* @param {string} rawXML: the request body of the notification POST 
* @param {string} authDigest: The HMAC signature algorithmn used
* @param {string} accountIdHeader: The account Id from the header
* @param {string} hmacSig1: The HMAC Signature number 1
* @returns {boolean} sigGood: Is the signatures good?
*/
function checkHmac (key1, rawXML, authDigest, accountIdHeader, hmacSig1) {    
    const authDigestExpected = 'HMACSHA256'
        , correctDigest = authDigestExpected === authDigest;
    if (!correctDigest) {
        console.log(`HMAC test: incorrect digest value--${authDigest}`);
        return false
    }

    // The key is relative to the account. So if the 
    // same listener is used for Connect notifications from 
    // multiple accounts, use the accountIdHeader to look up
    // the secrets for the specific account.
    //
    // For this example, the key is supplied by the caller
    //
    // Compute the SHA256 hmac for key1, rawXML
    const hmac = crypto.createHmac('sha256', key1);
    hmac.write(rawXML);
    hmac.end();
    const computedHmac = hmac.read().toString('base64');
    
    // Compare the hmac from the header with the computed value
    const sig1good = hmacSig1 === computedHmac;
    if (!sig1good) {
        console.log(`HMAC test failed! hmacSig1: ${hmacSig1}; computedHmac: ${computedHmac}`);
    }
    return sig1good
}

/**
* The enqueue function adds the xml to the queue.
* If test is true then a test notification is sent. 
* See https://medium.com/@drwtech/a-node-js-introduction-to-amazon-simple-queue-service-sqs-9c0edf866eca
* 
* @param {string} rawXML 
* @param {boolean||integer} test 
*/
async function enqueue(rawXML, test) {
    let error = false;
    if (test) {rawXML = ''}
    if (!test) {test = ''} // Always send a string
    // Set the region we will be using
    AWS.config.update({region: process.env['QUEUE_REGION']});
    // Create SQS service client
    const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
    // Setup the sendMessage parameter object
    let params = {
        // We're including the test value in the message body since
        // the ContentBasedDeduplication might only look at the 
        // MessageBody (docs aren't clear)
        MessageBody: JSON.stringify({test: test, xml: rawXML}),
        QueueUrl: process.env['QUEUE_URL']
    };
    // Only set the Message Group Id for FIFO queues!
    const messageGroupId = process.env['MESSAGE_GROUP_ID'];
    if (messageGroupId) {params.MessageGroupId = messageGroupId};

    try {
        await sqs.sendMessage(params).promise();
    }
    catch (e) {
        error = e
    }
    return error
}
