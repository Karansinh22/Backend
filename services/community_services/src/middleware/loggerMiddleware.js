const { logger } = require('../config/logger');

const logApiCalls = (req, res, next) => {
  setImmediate(() => {
    const { method, originalUrl, body, query, params } = req;
    const clientIp = req.ip;

    logger.info(`API Called : ${clientIp} : ${method} ${originalUrl}`, {
      query,
      params,
      body,
    });
  });
  next();
};

module.exports = logApiCalls;
