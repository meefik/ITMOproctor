var winston = require('winston');
var config = require('nconf');

var logger = new(winston.Logger)({
    level: config.get('logger:level'),
    transports: [
        new(winston.transports.Console)({
            timestamp: true,
            colorize: true,
        }),
        new(winston.transports.File)({
            json: false,
            filename: config.get('logger:file'),
        })
    ],
    exceptionHandlers: [
        new(winston.transports.Console)({
            timestamp: true,
            handleExceptions: true,
            humanReadableUnhandledException: true
        }),
        new(winston.transports.File)({
            json: false,
            timestamp: true,
            handleExceptions: true,
            humanReadableUnhandledException: true,
            filename: config.get('logger:file')
        })
    ],
    exitOnError: false
});

logger.stream = {
    write: function(message, encoding) {
        logger.info(message.slice(0, -1));
    }
};

logger.db = function(collectionName, method, query, doc, options) {
    // LOG format: Mongoose: exams.find({ student: ObjectId("55633e000cf842a221a37ae3") }) { sort: { beginDate: 1 }, fields: undefined } 
    logger.debug('Mongoose: %s.%s(%s) %s', collectionName, method, JSON.stringify(query), JSON.stringify(doc));
};

module.exports = logger;