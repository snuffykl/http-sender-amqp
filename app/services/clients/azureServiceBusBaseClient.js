const { ServiceBusClient, isServiceBusError } = require('@azure/service-bus');
const srcFile = __filename;

// A class that orchestrates creation of Azure Service Bus AMQP Client.
class AzureServiceBusBaseClient {
    /**
    * Create azure service bus client.
    *
    * @param {String} connectionString The connection string.
    */
    createClient(connectionString) {
        this._ensureNotNull('connectionString is required', connectionString);
        // ServiceBusClient has a default retry 3 times if we don't provide any retryOptions
        this.serviceBusClient = new ServiceBusClient(connectionString);
    }

    /**
    * return azure service bus client.
    * @returns {ServiceBusClient} service bus client
    */
    get client() {
        return this.serviceBusClient;
    }

    /**
    * Register receiver handler.
    *
    * @param receiver The client receiver.
    * @param {Callback} callback Callback for events.
    */
    registerReceiverHandler(receiver, callback) {
        this._ensureNotNull('receiver is required', receiver);

        const onMessageHandler = async (brokeredMessage) => {
            const messageBody = brokeredMessage.body;
            const context = {
                srcFile,
                operationName: 'AzureServiceBusClient.onMessageHandler',
                correlationId: messageBody ? messageBody.correlationId || messageBody.workflowInstanceId : undefined,
            };

            let isSuccessfulCallback = false;
            try {
                await callback(brokeredMessage);
                isSuccessfulCallback = true;
                await receiver.completeMessage(brokeredMessage);
            } catch (error) {
                const errorContext = Object.assign({}, context, {
                    error,
                });

                console.log(errorContext);

                if (isSuccessfulCallback) {
                    // eslint-disable-next-line max-len
                    const info = `Failed to complete message, current delivery count: ${brokeredMessage.deliveryCount}, error: ${error.message}.`;
                    console.log(Object.assign({}, context, { info }));
                }

                await this._handleAbandon(
                    () => receiver.abandonMessage(brokeredMessage));
            }
        };

        const onErrorHandler = async (error) => {
            const context = {
                srcFile,
                operationName: 'AzureServiceBusClient.onErrorHandler',
            };

            const errorContext = Object.assign({}, context, {
                error,
            });
            console.log(errorContext);
        };

        receiver.subscribe({
            processMessage: onMessageHandler,
            processError: onErrorHandler,
            options: {
                autoCompleteMessages: false,
            },
        });
    }

    /**
    * Close the client connection.
    *
    */
    async close() {
        if (this.serviceBusClient) {
            await this.serviceBusClient.close();
        }
    }

    /**
    * Handle message when abandon occurs.
    *
    */
    async _handleAbandon(callback) {
        const context = {
            srcFile,
            operationName: 'AzureServiceBusClient.handleAbandon',
        };

        try {
            await callback();
        } catch (error) {
            const errorContext = Object.assign({}, context, {
                error,
            });
            console.log(errorContext);

            // Terminate the service when the error from ASB Library is retriable
            // so that service will be restarted.
            if (this._isErrorRetriable(error)) {
                this._exit(error);
            }
        }
    }

    /**
    * Contract to ensure arguments not null.
    *
    */
    _ensureNotNull(message, arg) {
        if (!arg) {
            throw new Error(message);
        }
    }

    _isErrorRetriable(error) {
        return error && (isServiceBusError(error) || error.retryable);
    }

    async _exit(error) {
        const context = {
            srcFile,
            operationName: 'AzureServiceBusClient.exit',
        };

        // Do not call .close() here, else it would 'hang'.
        // We only reach here when there's a service bus error, its likely it won't be able to close
        // the connection any way.
        console.log(Object.assign({}, context,
            { error: { message: `Process exit (1) due to error: ${JSON.stringify(error)}` } }));
        process.exit(1);
    }
}

module.exports = AzureServiceBusBaseClient;