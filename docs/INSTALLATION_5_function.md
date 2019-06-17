# Create the Azure Function

#### Summary
Use this article to create an Azure 
**Function**.

#### Steps 

1. Open the 
   [Azure Portal](https://portal.azure.com/#home)
   page.
1. In the left-hand navigation column,
   at the top, click **Create a resoure**.
1. Search for **function** and then
   select **Function App**. 
   See figure 1:

   ![Search for Function App](Azure.09.function.create.png)
   
   Figure 1. Search for, and then select **Function App**

1. The Function App product page will be shown.
   Click **Create**.

1. The Function App Create form will be shown.
   Complete the form:
   1. **App name**: The name of your function.

      As shown on the form, the URL for your 
      function will be the combination of your 
      function's name and `.azurewebsites.net`

      **Record** the complete URL for your function,
      you will use the URL when you create your 
      DocuSign Connect subscription.
   1. **Resource Group**: Use the Resource Group that you
      created with the Service Bus Namespace.
   1. **OS**: This repository's function works with 
      both the Windows and Linux settings.
   1. **Hosting Plan**: Recommendation: use the 
      **Consumption Plan**.
   1. **Runtime Stack**: Use **JavaScript**.
   1. **Storage**: Recommendation: use the 
      form's suggested
      **new** storage option.
   
   Click the **Create** button. See figure 2:

   ![Create Function App](Azure.10.function.create.png)
   
   Figure 2. Complete the form, then click **Create**.

1. Azure will take a minute or two to provision your
   new function. The Azure portal will notify you 
   when the function is ready.

1. Return to your Resource Group page to locate the 
   new function. Click on its name to open the
   function's page.

1. On the function's page (see figure 3), 
   click **+ New function** for help with
   uploading the function's code
   to Azure.

   ![Create Function App](Azure.11.function.add.code.png)

   Figure 3. Click **New function** for help with
   uploading code to the function.

1. You can use any of the three upload methods
   suggested by Azure. 
   
   Notes:

   1. Install and upload the Node.js libraries as
      part of the package. To do so, run

      `npm install`

      after downloading this repository to your 
      development maching.

   1. The directory / file layout used in this repository
      has been tested with the VS Code Azure plugin.

   1. Set the following **Application Settings** (environment
      variables) for your function:

      * BASIC_AUTH_NAME  (optional)
      * BASIC_AUTH_PW (optional)
      * HMAC_1 (optional) the HMAC secret for HMAC 
        signature 1.
      * SVC_BUS_CONNECTION_STRING 
      * SVC_BUS_QUEUE_NAME

## Next steps

### Configure your Connect subscription
Refer to the DocuSign Connect documentation for information
on configuring the Connect subscription.

Note that the Connect subscription must not
include the envelopes' documents nor
Certificates of Completion in the notification 
messages.

### Create and configure your worker application
You can use any software stack and any 
language. See the 
[Service Bus quickstarts](https://docs.microsoft.com/en-us/azure/service-bus-messaging/) 
for more information.

For an example worker application, see
the [connect-node-worker-azure](../../connect-node-worker-azure)
repository.

### Testing

#### Testing with Connect
Create a Connect subscription that will notify the 
Azure Function. Check that the notification message is then
received and processed by your worker application.

#### Integration tests
Use the `runTest.js` test application in the example worker 
repository to run end-to-end integration tests.

The tests send test messages from the Azure Function to the 
worker application behind the firewall.
