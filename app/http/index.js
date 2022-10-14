const uuid = require('node-uuid');
const server = require('./server');
const {QUEUE_NAMES} = require('../constants');
const azureServiceBusQueueClient = require('../services/clients/azureServiceBusClient');
const azureServiceBusFactory = require('../services/clients/azureServiceBusFactory');
const asyncActionQueue = require('../core/asyncActionQueue');

const srcFile = __filename;

const context = {
    srcFile,
    operationName: 'event.index',
    correlationId: uuid.v4(),
};

/**
 * Factory to create AMQP client.
 */
async function createAzureServiceBusClient() {
    try {
        const asyncActionSender = azureServiceBusFactory.createQueueSenderClient(QUEUE_NAMES.ASYNC_ACTION);

        asyncActionQueue.init({ asyncActionSender });
    } catch (error) {
        const errorMessage = `Failed to create azure service bus queue sender client. Error: ${error}`;
        const errorContext = Object.assign({}, context, {
            error: { message: errorMessage },
        });
        console.log(errorContext);

        await azureServiceBusQueueClient.close();
        process.exit(1);
    }

    return Promise.resolve();
}

/**
 * Starts action service.
 */
async function startApp() {
    let info = `Starting ${process.env.SERVICE_NAME}`;
    console.log(Object.assign({}, context, { info }));

    await createAzureServiceBusClient();
    const serverInstance = server.listen();
    process.on('SIGTERM', () => {
        serverInstance.close(async () => {
            await azureServiceBusQueueClient.close();
            process.exit(0);
        });
    });

    info = `Started ${process.env.SERVICE_NAME}`;
    console.log(Object.assign({}, context, { info }));
}

startApp();