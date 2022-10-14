const KoaRouter = require("koa-router");
const extendRequestTimeout = require("../util/extendRequestTimeout");
const logger = console;
const asyncActionQueue = require('../../core/asyncActionQueue');
const uuid = require('node-uuid');

const srcFile = __filename;

class ActionsController extends KoaRouter {
  constructor() {
    super();
    super.post("/actions/:id/executions", extendRequestTimeout, this.executeAction);
  }

  /**
   * Create a task from the request body
   *  sends the task & a location header
   */
  async executeAction(context) {
    Object.assign(context, {
      srcFile,
      operationName: 'ActionsController.executeAction',
    });

    try {
      const actionInstanceId = context.params.id || `${uuid.v4()}`;
      const message = {
        actionInstanceId: actionInstanceId,
      };

      // Sender message
      await asyncActionQueue.enqueue(context, actionInstanceId, message)

      Object.assign(context.response, { status: 200, body: actionInstanceId });
      logger.info(`Executed action with Id: ${actionInstanceId}`);
    } catch (error) {
      logger.error(`Failed to execute action. Error: ${error}`);
      throw error;
    }
  }
}

module.exports = new ActionsController();
