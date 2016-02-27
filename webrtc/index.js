module.exports = function(io) {
    var webcall = require('./webcall');
    webcall(io, ['/webcall']);
};