const azureServiceBusQueueClient = require('./azureServiceBusClient');

// A class to orchestrate the Azure Service Bus creation.
class AzureServiceBusFactory {
    constructor() {
        if (!process.env.AZURE_SERVICEBUS_CONNECTION_STRING) {
            throw new Error('AZURE_SERVICEBUS_CONNECTION_STRING env var is required');
        }

        this.connectionString = process.env.AZURE_SERVICEBUS_CONNECTION_STRING;
    }

    /**
    * Create azure service bus queue sender client.
    *
    * @param {String} queueName The queue name.
    * @returns  {SenderClient} queue client
    */
    createQueueSenderClient(queueName) {
        azureServiceBusQueueClient.create(this.connectionString);
        return azureServiceBusQueueClient.createSender(queueName);
    }
}

module.exports = new AzureServiceBusFactory();