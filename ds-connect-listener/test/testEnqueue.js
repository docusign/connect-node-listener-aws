/**
 * @file testEnqueue.js -- locally enqueue a test message to the queue

 * Environment variables
 * QUEUE_URL
 * QUEUE_REGION -- eg 'us-east-2' 
 * 
 * References
 */

const AWS = require('aws-sdk');

const debug = true;

const debugLog = msg => {if (debug) {console.log(msg)}};
main();

async function main () {
    debugLog(`\nStarted!`);
    let  error = await enqueue ('', Date.now());
    if (error === false) {error = "Success!"}
    debugLog(`Result: ${error}\n`);
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

