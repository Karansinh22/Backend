 const { createLogger, format, transports } = require('winston');

// Configure logger
const logger = createLogger({
  level: 'info', // Set the minimum logging level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      ({ timestamp, level, message, ...meta }) =>
        `${timestamp} [${level.toUpperCase()}] : ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`
    )
  ),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({ filename: 'src/logs/api.log' }), // Log to a file
  ],
});

const cronLogger = createLogger({
  level: 'info', // Set the minimum logging level
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(
      ({ timestamp, level, message, ...meta }) =>
        `${timestamp} [${level.toUpperCase()}] : ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`
    )
  ),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({ filename: 'src/logs/cron.log' }), // Log to a file
  ],
});

// module.exports = logger;
module.exports = {
  logger,
  cronLogger,
}
