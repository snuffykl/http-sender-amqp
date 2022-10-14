const AzureServiceBusBaseClient = require('./azureServiceBusBaseClient');
const config = require('../../config');

class AzureServiceBusQueueClient extends AzureServiceBusBaseClient {
    /**
    * Create azure service bus client.
    *
    * @param {String} connectionString The connection string.
    */
    create(connectionString) {
        super.createClient(connectionString);
    }

    /**
    * Create sender.
    *
    * @param {String} queueName The sender queue name.
    * @returns {SenderClient} The sender client.
    */
    createSender(queueName) {
        this._ensureNotNull('queueName is required', queueName);
        return super.client.createSender(queueName);
    }

    /**
    * Create receiver.
    *
    * @param {String} queueName The receiver queue name.
    * @returns The receiver client.
    */
    createReceiver(queueName) {
        this._ensureNotNull('queueName is required', queueName);
        return super.client.createReceiver(queueName, {
            receiveMode: 'peekLock',
            maxAutoLockRenewalDurationInMs: config.ENV.AZURE_SERVICEBUS_LOCK_RENEWAL_INTERVAL_MILLISECONDS,
        });
    }
}

module.exports = new AzureServiceBusQueueClient();