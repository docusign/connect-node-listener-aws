# Create a Service Bus Queue

#### Summary
Use this article to create a 
**Service Bus queue** for your Service Bus Namespace.

The **queue name** will be used by both
the listener function and the worker application.

#### Steps
1. Open the 
   [Azure Resource groups](https://portal.azure.com/#blade/HubsExtension/BrowseResourceGroupBlade/resourceType/Microsoft.Resources%2Fsubscriptions%2FresourceGroups)
   page.
1. Click on your resource group's name.
1. Your resource group's page will be shown.
   Click on your resource that has **Type**
   **Service Bus Namespace**. 
1. The page for your Service Bus Namespace will be shown. 
   
   In the top middle navigation section, click
   **+ Queue**. See figure 1.

   ![Service Bus Namespace](Azure.07.add.queue.png)
   
   Figure 1. The page for your Service Bus Namespace. Click **+ Queue**.

1. The **Create queue** form modal will be shown.
   Complete the form and click **Create** at the 
   bottom of the form. 
   See figure 2:    

   ![Create queue](Azure.08.add.queue.png)
   
   Figure 2. Complete the form and 
   click **Create**

1. Record the **Queue name**. It is used for both
   the listener function and the worker application. 

Next: Create the
[Azure Function](INSTALLATION_5_function.md).


