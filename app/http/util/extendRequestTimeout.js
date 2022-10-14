const parse = require('parse-duration');

module.exports = function extendTimout(ctx, next) {
    // set 10 minutes socket timeout
    const TEN_MINUTES = parse('10m');
    ctx.request.socket.setTimeout(TEN_MINUTES);
    return next();
};
