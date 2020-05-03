const { ServiceBusClient, ReceiveMode } = require('@azure/service-bus');
const co = require('co');
const contains = require('lodash/fp/contains');
const logger = console;
const { Config } = require('../../config');
const { SERVICE_BUS_ERROR_FILTER } = require('../../constants');
const srcFile = __filename;

class AzureServiceBusClient {

  constructor(connectionString) {
    this._ensureNotNull('connectionString is required', connectionString);
    this.client = ServiceBusClient.createFromConnectionString(connectionString);
  }

  /**
   * Create sender.
   *
   * @param {String} queueName The sender queue name.
   * @returns {SenderClient} The sender client.
   */
  createSender(queueName) {
    this._ensureNotNull('queueName is required', queueName);
    this.queueName = queueName;
    const queueClient = this.client.createQueueClient(queueName);
    return queueClient.createSender();
  }

  /**
   * Create receiver.
   *
   * @param {String} queueName The receiver queue name.
   * @returns {ReceiverClient} The receiver client.
   */
  createReceiver(queueName) {
    this._ensureNotNull('queueName is required', queueName);
    this.queueName = queueName;
    const queueClient = this.client.createQueueClient(queueName);
    return queueClient.createReceiver(ReceiveMode.peekLock);
  }

  /**
   * Register receiver handler.
   *
   * @param {Receiver} receiver The queue receiver.
   * @param {Callback} callback Callback for events.
   */
  registerReceiverHandler(receiver, callback) {
    this._ensureNotNull('receiver is required', receiver);

    const onMessageHandler = this.createOnMessageHandler(callback);
    const onErrorHandler = this.createOnErrorHandler();

    receiver.registerMessageHandler(
      onMessageHandler,
      onErrorHandler,
      {
        autoComplete: false,
        maxMessageAutoRenewLockDurationInSeconds: Config.autoLockRenewalInterval(),
        maxConcurrentCalls: Config.serviceBusMaxConcurrentCalls(),
      });
  }

  /**
   * Creates on message handler.
   *
   * @returns {OnMessageHandler} The on message handler.
   */
  createOnMessageHandler(callback) {
    const context = {
      srcFile,
      operationName: 'AzureServiceBusClient.onMessageHandler',
    };

    const onMessageHandler = (brokeredMessage) => co(function* handle() {
      try {
        yield callback(brokeredMessage);
        yield brokeredMessage.complete();
      } catch (error) {
        logger.error(error);

        // Process exit (1) when SERVICEUNAVAILABLE from ASB Library.
        if (error && error.translated && contains(error.name, SERVICE_BUS_ERROR_FILTER)) {
          yield this._exit(error);
          return;
        }

        yield this._handleAbandon(
            () => brokeredMessage.abandon());
      }
    }.bind(this));

    return onMessageHandler;
  }

  /**
  * Creates on error handler.
  *
  * @returns {OnErrorHandler} The on error handler.
  */
  createOnErrorHandler() {
    const context = {
      srcFile,
      operationName: 'AzureServiceBusClient.onErrorHandler',
    };
    const onErrorHandler = (error) => co(function* handleError() {
      logger.error(error);

      if (error && error.name && error.translated) {
        yield this._exit(error);
      }
    }.bind(this));

    return onErrorHandler;
  }

  /**
  * Close the client connection.
  *
  */
  close() {
    return co(function *close() {
      if (this.client) {
        return yield this.client.close();
      }
      return Promise.resolve();
    }.bind(this));
  }

  /**
   * Exit process with error
   */
  _exit(error) {
    const context = {
      srcFile,
      operationName: 'AzureServiceBusClient.exit',
      startTimestamp: new Date,
    };

    return co(function *exit() {
      try {
        yield this.close();
      } catch (err) {
        logger.error(`Fail to close AMQP connection due to: ${error}`);
      }
      logger.error(`Process exit (1) due to error: ${JSON.stringify(error)}`);
      process.exit(1);
    }.bind(this));
  }

 /**
  * Handle message when abandon occurs.
  *
  */
  _handleAbandon(callback) {
    const context = {
      srcFile,
      operationName: 'AzureServiceBusClient.handleAbandon',
    };

    return co(function *handle() {
      try {
        yield callback();
      } catch (error) {
        logger.error(error);

        // Process exit (1) when SERVICEUNAVAILABLE from ASB Library.
        if (error && error.translated && contains(error.name, SERVICE_BUS_ERROR_FILTER)) {
          yield this._exit(error);
        }
      }
    }.bind(this));
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
}

module.exports = AzureServiceBusClient;
