const AzureServiceBusClient = require('./clients/azureServiceBusClient');
const { Config } = require('../config');
const logger = console;
const uuid = require('uuid');

const srcFile = __filename;

/**
 * Create context helper.
 *
 * @param {*} parentContext parent context to inherit from.
 * @param {*} operationName Name of the context operation.
 */
const createContext = (parentContext, operationName) =>
  Object.assign({}, parentContext, {
    srcFile,
    operationName,
    startTimestamp: new Date,
  });

class MessageSender {
  constructor() {
    this.clientSenders = {};
    this._azureServiceBusClient = new AzureServiceBusClient(Config.azureServiceBusConnectionString());
    this.disposeAzureServiceBusClientCounter = 0;
  }

  async _initialize(queueName) {
    if (!this._azureServiceBusClient) {
      logger.info('Reinstantiating azureServiceBusClient');
      this._azureServiceBusClient = new AzureServiceBusClient(Config.azureServiceBusConnectionString());
      logger.info('Successfully reinstantiate azureServiceBusClient');
    }

    const sender = this.clientSenders[queueName];

    if (!sender) {
      logger.info(`Creating sender for queue: ${queueName}`);
      this.clientSenders[queueName] = this._azureServiceBusClient.createSender(queueName);
      logger.info(`Successfully create sender for queue: ${queueName}`);
    }
  }

  async _enqueueMessage(context, queueName, message, messageId) {
    await this._initialize(queueName);

    let userProperties = {};

    if (context.operationId) {
      userProperties = { operationId: context.operationId };
    }

    const sbMessage = {
      body: message,
      messageId,
      userProperties,
    };

    await this.clientSenders[queueName].send(sbMessage);

    // eslint-disable-next-line max-len
    logger.info(
      `Successfully queue message to ${queueName}, msgId: ${messageId}, msgBody: ${JSON.stringify(message)}`);
  }

  async send(parentContext, queueName, message, messageId = null) {
    const context = createContext(parentContext, 'MessageSender.send');
    if (!messageId) {
      logger.info(`Generate uuid for messageId  due to messageId is ${messageId}`);
      // eslint-disable-next-line no-param-reassign
      messageId = uuid.v4(); // Randomly generate messageId being provided.
    }

    try {
      await this._enqueueMessage(context, queueName, message, messageId);
    } catch (error) {
      // eslint-disable-next-line max-len
      logger.error(`Failed to send message to ${queueName} due to ${JSON.stringify(error)}`, context);

      // Dispose ASB client and let it reinstantiate again the next call.
      if (error && error.name && error.translated) {
        try {
          this.disposeAzureServiceBusClientCounter++;
          logger.info(
            `Increase dispose counter value to : ${this.disposeAzureServiceBusClientCounter}`);
          if (this.disposeAzureServiceBusClientCounter < 3) {
            delete this.clientSenders[queueName];
            logger.info(`Sucessfully dispose clientSenders for queueName: ${queueName}`);
          } else {
            logger.info(`Dispose counter value: ${this.disposeAzureServiceBusClientCounter} limit reached`);
            if (this._azureServiceBusClient) {
              await this._azureServiceBusClient.close();
              delete this._azureServiceBusClient;
            }

            Object.keys(this.clientSenders).forEach(k => delete this.clientSenders[k]);
            logger.info('Sucessfully dispose azureServiceBusClient and clientSenders');
            this.disposeAzureServiceBusClientCounter = 0; // Reset counter
          }
        } catch (err) {
          logger.error(`Fail to close AMQP connection due to: ${err}`);
        }
      }

      throw error;
    }
  }
}

// expose as singleton
module.exports = new MessageSender();
