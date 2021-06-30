var winston = require('winston');
var format = winston.format;
var config = require('nconf');

function printFn(options) {
  return options.timestamp + ' ' + options.level + ' ' + options.message;
}

var logger = winston.createLogger({
  level: config.get('logger:level'),
  format: format.combine(format.timestamp(), format.colorize(), format.printf(printFn)),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
      handleExceptions: true
    })
  ],
  exitOnError: false
});

logger.stream = {
  write: function(message) {
    logger.info(message.slice(0, -1));
  }
};

module.exports = logger;
