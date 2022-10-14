const srcFile = __filename;

class AsyncActionQueue {
    constructor() {
        this.maxAttempts = 5;
        this.delayIncrease = 3;
        this.maxProcessMessageAttempts = 9;
    }

    /**
     * Initializes async action options.
     * @param {Object} options
     */
    init(options = {}) {
        if (!options.asyncActionSender) {
            throw new Error('asyncActionSender is required');
        }

        this.azureQueueSenderClient = options.asyncActionSender;
    }

    /**
    * return azure service bus queue sender client.
    * @returns {ServiceBusSender} service bus queue sender.
    */
    get QueueSenderClient() {
        return this.azureQueueSenderClient;
    }

    async timeout(seconds) {
        return new Promise(res => setTimeout(res, seconds * 1000));
    }

    async enqueue(parentContext, actionId, message, scheduledEnqueueTime = null) {
        const context = Object.assign({}, parentContext, {
            srcFile,
            operationName: 'AsyncActionQueue.enqueue',
            startTimestamp: new Date(),
        });

        let newScheduledEnqueueTime;
        if (!scheduledEnqueueTime) {
            // Schedule message queueing time 5 secs to avoid SWF race conditions
            newScheduledEnqueueTime = new Date((new Date()).getTime() + 5000);
        } else {
            newScheduledEnqueueTime = scheduledEnqueueTime;
        }

        Object.assign(message, { actionId, actionStartTimestamp: parentContext.actionStartTimestamp });
        let updatedMessage = message;

        Object.assign(updatedMessage, { tenantId: parentContext.tenantId, correlationId: parentContext.correlationId });
        const messageToSend = { body: updatedMessage };

        let attempts = 0;
        while (true) { // eslint-disable-line no-constant-condition
            try {
                attempts++;

                await this.QueueSenderClient.scheduleMessages([messageToSend], newScheduledEnqueueTime);

                break;
            } catch (error) {
                if (attempts >= this.maxAttempts) {
                    const errorMessage = `Failed on enqueue asyncactions after ${this.maxAttempts}.`;
                    console.log(Object.assign({}, context, { error: { message: errorMessage } }));
                    throw error;
                }

                const delayInterval = this.delayIncrease * attempts;
                const info = `Retrying enqueue after ${delayInterval} seconds. Error: ${error.message}.`;
                console.log(Object.assign({}, context, { info }));
                await this.timeout(delayInterval);
            }
        }
    }
}

// expose as singleton
module.exports = new AsyncActionQueue();