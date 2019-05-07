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
            , authRaw0 = (event.headers && event.headers.Authorization) || ''
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
        const authDigest = req.headers['x-authorization-digest']
            , accountIdHeader = req.headers['x-docusign-accountid']
            , hmacSig1 = req.headers['x-docusign-signature-1']
            ;
        hmacPassed = checkHmac(hmac1, rawXML, authDigest, accountIdHeader, hmacSig1)
        if (!hmacPassed) {
            context.log.error(`${new Date().toUTCString()} HMAC did not pass!!`);
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
            // Wait 25 sec and then try again
            await sleep(25000);
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
if (!correctDigest) {return false}

// The key is relative to the account. So if the 
// same listener is used for Connect notifications from 
// multiple accounts, use the accountIdHeader to look up
// the secrets for the specific account.
//
// For this example, the key is supplied by the caller
const sig1good = hmacSig1 === computeHmac(key1, rawXML);
return sig1good
}

/**
* Compute a SHA256 HMAC on the <content> with the <key>
* The Base64 representation of the HMAC is then returned 
* @param {string} key 
* @param {*} content
* @returns {string} Base64 encoded SHA256 HMAC 
*/
function computeHmac(key, content) {
const hmac = crypto.createHmac('sha256', key);
hmac.write(content);
hmac.end();
return hmac.read().toString('base64');
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
    if (!test) {test = 0}
    // Set the region we will be using
    AWS.config.update({region: process.env['QUEUE_REGION']});
    // Create SQS service client
    const sqs = new AWS.SQS({apiVersion: '2012-11-05'});
    // Setup the sendMessage parameter object
    const params = {
        // We're including the test value in the message body since
        // the ContentBasedDeduplication might only look at the 
        // MessageBody (docs aren't clear)
        MessageBody: JSON.stringify({test: test, xml: rawXML}),
        MessageGroupId: "1",
        QueueUrl: process.env['QUEUE_URL']
    };
    try {
        await sqs.sendMessage(params).promise();
    }
    catch (e) {
        error = e
    }
    return error
}