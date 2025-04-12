const winston = require('winston');

let logger;

module.exports = {
  init: (level = 'info') => {
    logger = winston.createLogger({
      level,
      transports: [new winston.transports.Console()]
    });
  },

  end: () => {
    logger = null;
  },

  log: (level, msg) => {
    if (logger) logger.log({ level, message: msg });
  },

  setLogLevel: (level) => {
    if (logger) logger.level = level;
  }
};
