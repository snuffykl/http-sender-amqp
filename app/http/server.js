const http = require("http");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const validate = require("koa-validate");
const livenessController = require("./controllers/livenessController");
const taskController = require("./controllers/taskController");
const { Config } = require("../config");

/**
 * Start the server
 */
function listen() {
  console.log(`Starting ${Config.serviceName()} API server`);
  const koaApp = new Koa();
  validate(koaApp);
  koaApp.use(bodyParser({ jsonLimit: "24mb" }));
  koaApp.use(livenessController.routes(), livenessController.allowedMethods());
  koaApp.use(taskController.routes(), taskController.allowedMethods());

  const ManageRequestContext = (req, res) => {
    // establish the context at the start of the request
    res.on("finish", () => {
      // dispose of the context once the final bytes of the response have been sent
    });
  };
  const KoaRequestPipeline = koaApp.callback();
  const server = http
    .createServer((...args) => {
      // eslint-disable-next-line new-cap
      ManageRequestContext(...args);
      // eslint-disable-next-line new-cap
      KoaRequestPipeline(...args);
    })
    .listen(80);

  console.log(`Started ${Config.serviceName()} API server`);

  return server;
}

module.exports = { listen };
