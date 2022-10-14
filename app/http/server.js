const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const livenessController = require("./controllers/livenessController");
const actionsController = require("./controllers/actionsController");
const { Config } = require("../config");

/**
 * Start the server
 */
function listen() {
  console.log(`Starting ${Config.serviceName()} API server`);
  const koaApp = new Koa();
  koaApp.use(bodyParser({ jsonLimit: "24mb" }));
  koaApp.use(livenessController.routes(), livenessController.allowedMethods());
  koaApp.use(actionsController.routes(), actionsController.allowedMethods());

  return koaApp.listen(80);
}

module.exports = { listen };
