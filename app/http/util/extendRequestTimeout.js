const parse = require('parse-duration');

module.exports = function extendTimout(ctx, next) {
  const TIMEOUT = parse('288s');
  ctx.request.socket.setTimeout(TIMEOUT);
  return next();
};
