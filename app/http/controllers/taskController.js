const KoaRouter = require("koa-router");
const extendRequestTimeout = require("../util/extendRequestTimeout");
const logger = console;
const messageSender = require("../../services/messageSender");
const { Config } = require("../../config");

const srcFile = __filename;

class TaskController extends KoaRouter {
  constructor() {
    super();
    super.post("/task", extendRequestTimeout, this.create);
  }

  /**
   * Create a task from the request body
   *  sends the task & a location header
   */
  async create(context) {
    Object.assign(context, {
      srcFile,
      operationName: "TaskController.create",
    });

    try {
      const taskId = "DummyId";
      const emailMessage = {
        taskId: taskId,
      };

      // Sender message
      await messageSender.send(context, Config.taskEmailQueueName(), emailMessage);

      Object.assign(context.response, { status: 201, body: taskId });
      logger.info(`Created task with Id: ${taskId}`);
    } catch (error) {
      logger.error(`Failed to create task. Error: ${error}`);
      throw error;
    }
  }
}

module.exports = new TaskController();
