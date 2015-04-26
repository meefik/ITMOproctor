var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongoose:uri'));
var db = mongoose.connection;
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
db.on('error', function(err) {
    console.error("MongoDB connection error:", err.message);
});
db.once('open', function() {
    console.info("MongoDB is connected.");
});
module.exports = mongoose;