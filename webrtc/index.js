var call = require('./call');
var screen = require('./screen');
module.exports = function(app) {
    call(app);
    screen(app);
}