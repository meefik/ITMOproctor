var winston = require('winston');
var config = require('nconf');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            json: false,
            timestamp: true,
            level: config.get('logger:level')
        })
    ],
    exceptionHandlers: [
        new(winston.transports.Console)({
            json: false,
            timestamp: true,
            level: config.get('logger:level')
        })
    ],
    exitOnError: false
});

module.exports = logger;