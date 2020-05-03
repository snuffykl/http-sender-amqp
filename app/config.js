/**
 * Abstraction of service configuration
 */
class Config {
    constructor() {
      this.optional = process.env;
      this.required = new Proxy(process.env, {
        get: (target, name) => {
          const value = target[name];
          if (!value) {
            throw new Error(`Missing Required Environment Variable: ${name}`);
          }
          return value;
        },
      });
    }
  
    azureServiceBusConnectionString() {
      return this.required.AZURE_SERVICEBUS_CONNECTION_STRING;
    }
  
    taskEmailQueueName() {
      return this.required.TASK_EMAIL_QUEUE_NAME;
    }
  
    autoLockRenewalInterval() {
      if (!process.env.AZURE_SERVICEBUS_AUTOLOCKRENEWAL_SECONDS) {
        throw new Error('Environment variable AZURE_SERVICEBUS_AUTOLOCKRENEWAL_SECONDS missing');
      }
      return parseInt(this.required.AZURE_SERVICEBUS_AUTOLOCKRENEWAL_SECONDS.toString(), 10);
    }
  
    // NOTE: If this number is increased, the memory limits placed on the
    // listener's container must be increased appropriately as well.
    serviceBusMaxConcurrentCalls() {
      if (!process.env.AZURE_SERVICEBUS_MAXCONCURRENTCALLS) {
        throw new Error('Environment variable AZURE_SERVICEBUS_MAXCONCURRENTCALLS missing');
      }
      return parseInt(this.required.AZURE_SERVICEBUS_MAXCONCURRENTCALLS.toString(), 10);
    }

    serviceName() {
      return this.required.SERVICE_NAME;
    }
  }
  
  module.exports = {
    Config: new Config()
  };
  