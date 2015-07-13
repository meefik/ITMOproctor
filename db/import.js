var config = require('nconf').file('../config.json');
var mongoose = require('mongoose');
var config = require('nconf');
var Grid = require('gridfs-stream');
var fs = require('fs');
var path = require('path');
var moment = require('moment');

if (process.argv.length !== 3) {
    console.error('Usage: node import.js <data.json>');
    process.exit(1);
}

mongoose.connect(config.get('mongoose:uri'));
var conn = mongoose.connection;
conn.on('error', function(err) {
    console.error("MongoDB connection error:", err.message);
});
conn.once('open', function() {
    console.info("MongoDB is connected.");
    db.gfs = Grid(conn.db, mongoose.mongo);
    var data = require(path.join(__dirname, process.argv[2]));
    db.go(data, function() {
        mongoose.disconnect();
        console.log('done');
        process.exit(0);
    });
});

var db = {
    next: function(callback) {
        if (!this.iterator) this.iterator = 0;
        if (arguments.length === 0) this.iterator++;
        else {
            this.iterator--;
            if (this.iterator <= 0) {
                process.stdout.write("\n");
                callback();
            }
        }
        process.stdout.write(".");
    },
    save: function(obj, callback) {
        obj.save(function(err, data) {
            if (err) console.log(err);
            if (callback) callback();
        });
    },
    store: function(files, callback) {
        if (files.length === 0) return callback();
        files.forEach(function(file, i, arr) {
            var fullname = path.join(__dirname, 'files', file.filename);
            fs.exists(fullname, function(exists) {
                if (!exists) {
                    if (callback) callback();
                    return;
                }
                var writestream = db.gfs.createWriteStream({
                    _id: file.fileId,
                    filename: file.filename
                });
                fs.createReadStream(fullname).pipe(writestream);
                writestream.on('close', function(data) {
                    if (callback) callback(data);
                });
            });
        });
    },
    go: function(data, callback) {
        var self = this;
        if (data.user) {
            var User = require('./models/user');
            var items = data.user;
            for (var k in items) {
                var obj = new User(items[k]);
                self.next();
                self.save(obj, function() {
                    self.next(callback);
                });
                self.next();
                self.store(items[k].attach, function() {
                    self.next(callback);
                });
            }
        }
        if (data.exam) {
            var Exam = require('./models/exam');
            var items = data.exam;
            for (var k in items) {
                //var d = moment().add((k-1)*5,'hours');
                //items[k].beginDate = moment(d).add(1,'minutes');
                //items[k].endDate = moment(d).add(4,'hours');
                var obj = new Exam(items[k]);
                self.next();
                self.save(obj, function() {
                    self.next(callback);
                });
            }
        }
    }
};
