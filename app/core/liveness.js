const srcFile = __filename;

class Monitoring {
  liveness(context) {
    Object.assign(context, { srcFile, operationName: 'GET /liveness' });
    context.body = 'Ok'; // eslint-disable-line no-param-reassign
    return Promise.resolve();
  }
}

module.exports = Monitoring;
