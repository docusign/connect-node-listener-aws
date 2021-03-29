# AWS Infrastructure

To deploy the infrastructure in your AWS subscription, follow the instructions below.

## Prerequisites

Ensure you have [Serverless Framework](https://www.serverless.com/framework/docs/getting-started/) installed. You will also need to setup your AWS account with Serverless. To do so, please follow the instructions from [Serverless documenation](https://www.serverless.com/framework/docs/providers/aws/guide/credentials/#create-an-iam-user-and-access-key). Be sure to first run `npm i` in current directory first.

## Steps:
 1) Define the following environment variables:
    - `REGION` : The AWS region to deploy the infra to. For example, `us-east-1`. For a full list of regions, see [region list](https://aws.amazon.com/about-aws/global-infrastructure/regions_az/).
    - `AUTH_NAME`: Your Connect authentication user name.
    - `BASIC_AUTH_PW`: Your Connection authentication password.
    - `HMAC`: HMAC to use for verification.
2) After the variables are set, you can simply do: `sls deploy` to deploy the infrastructure. 

After step 2 is compeleted, you wll be presented with your function endpoint:


Refer to [Serverless docs](https://www.serverless.com/framework/docs/providers/aws/) for more information.
