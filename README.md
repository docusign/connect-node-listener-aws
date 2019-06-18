# Connect Node Listener for AWS

This application is a microservice for use with 
[AWS Lambda](https://aws.amazon.com/lambda/)
serverless functions.

It acts as a server (a **listener**) for DocuSign
Connect notification messages. After checking the 
message's Basic Authentication and HMAC values,
the software enqueues the message onto an
[AWS Simple Queue Service (SQS)](https://aws.amazon.com/sqs/)
queue for processing by other software apps.

The repo 
[connect-node-worker-aws](../../../connect-node-worker-aws)
is an example worker application.
It receives messages from the queue
and then processes
them. See that repo for more information.

## Architecture
![Connect listener architecture](docs/connect_listener_architecture.png)

This figure shows the solution's architecture. 
This application is written in Node.js. 
The example worker app is also written in Node.js but 
could be written in a different language.

### Presentation
A [presentation](https://docusigninc.box.com/shared/static/1nv8xcqf01vteyjve8sgwgdko98muk0t.pdf)
about using AWS as a listener for incoming
Connect calls is also available.

## Installation

Short form instructions are below. 
[Long form](INSTALLATION.md) instructions are also available.

### Create an AWS SQS queue 
1. Provision an 
   [SQS](https://aws.amazon.com/sqs/) **Queue**. 
   Either a `Standard` or `FIFO` queue can be used.

1. Record the queue's **AWS Region** and **URL**. 
   They will be used
   by the listener and by the worker application.

1. If a `FIFO` queue is used, Content-Based Deduplication 
   must be enabled. 
   (Or provide a `MessageDeduplicationId`
   for each queue entry.)

### Lambda Function
1. Provision a Lambda function.

   **Runtime**: `Node.js 8.x` or `Node.js 10.x`

   **Execution role**: `Create a new role with basic Lambda permissions`

   Add an **API Gateway** trigger.
   
   **Record** the **API endpoint URL** for the function. 
   You will provide this URL to DocuSign Connect.

   **Settings for the Lambda function:**

   **Handler**: `index.handler`

   **Timeout**: Use 15 seconds

1. Update the code content of the Lambda function to
   use this repo's `index.js` file. A `package.json` 
   file is not needed.

   You can use the online IDE or a local IDE.

1. Set the Environment Variables for your function:
   1. **BASIC_AUTH_NAME**: optional. The Basic Authentication
      name set in the Connect subscription.
   1. **BASIC_AUTH_PW**: optional. The Basic Authentication
      password set in the Connect subscription.
   1. **HMAC_1**: optional. The HMAC secret used by the
      Connect subscription.
   1. **QUEUE_REGION**: required. 
      The AWS region for your SQS queue. Example: `us-east-2`
   1. **QUEUE_URL**: required. 
   1. If a `Standard` queue is used, do **not** set 
      the  **MESSAGE_GROUP_ID** environment variable.
   
      If a `FIFO` queue is used, the
      **MESSAGE_GROUP_ID** environment variable **must** be set.
      Use `1`.

### Attach SQS policy to the Lambda function’s IAM role
By default, the Lambda function will not have 
sufficient privileges to enqueue messages onto
the SQS queue.

Use IAM to add an SQS policy to the Lambda function's
IAM role.

## Testing
Configure a DocuSign Connect subscription to send notifications to
the Lambda function. Create / complete a DocuSign envelope.
Check the Connect logs for feedback.

### Test messages feature
This application and the worker application enable test
messages to be sent via the queuing system. The test
messages do not include XML Connect notification
messages. 

To send a test message, use the function's URL with
query parameter `test` set to
a test value. A GET or POST request can be used. 

### Integration testing
The worker application includes the test tool `runTest.js` 

See the worker application for information on running the
integration tests.

## Usage
**Do not include documents in the notification messages**
The SQS system will not support messages that
include documents. Check that your Connect subscription
is configured to not include envelope documents nor the
envelope's Certificate of Completion.

## License and Pull Requests

### License
This repository uses the MIT License. See the LICENSE file for more information.

### Pull Requests
Pull requests are welcomed. Pull requests will only be considered if their content
uses the MIT License.

