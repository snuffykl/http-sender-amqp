const KoaRouter = require('koa-router');
const MonitoringController = require('../../core/liveness')
const monitoringController = new MonitoringController();

// expose as singleton
module.exports = new KoaRouter().get('/liveness', monitoringController.liveness);
