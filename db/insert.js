var config = require('nconf').file('../config.json');
var mongoose = require('mongoose');
var config = require('nconf');
var moment = require('moment');

if (process.argv.length !== 3) {
    console.error('Usage: node insert.js <data.json>');
    process.exit(1);
}

mongoose.connect(config.get('mongoose:uri'));
var conn = mongoose.connection;
conn.on('error', function(err) {
    console.error("MongoDB connection error:", err.message);
});
conn.once('open', function() {
    console.info("MongoDB is connected.");
    var data = require(process.argv[2]);
    db.generator(data, function() {
        console.log('ok');
    });
});
process.on('SIGINT', function() {
    mongoose.disconnect();
});

var User = require('./models/user');
var Exam = require('./models/exam');
var Passport = require('./models/passport');

var db = {
    save: function(obj) {
        obj.save(function(err, data) {
            if (err) console.log(err);
        });
    },
    generator: function(data, callback) {
        var self = this;
        if (data.user) {
            User.remove({}, function(err) {
                var items = data.user;
                for (var k in items) {
                    var obj = new User(items[k]);
                    self.save(obj);
                }
            });
        }
        if (data.passport) {
            Passport.remove({}, function(err) {
                var items = data.passport;
                for (var k in items) {
                    var obj = new Passport(items[k]);
                    self.save(obj);
                }
            });
        }
        if (data.exam) {
            Exam.remove({}, function(err) {
                var items = data.exam;
                for (var k in items) {
                    //var d = moment().add((k-1)*5,'hours');
                    //items[k].beginDate = moment(d).add(1,'minutes');
                    //items[k].endDate = moment(d).add(4,'hours');
                    var obj = new Exam(items[k]);
                    self.save(obj);
                }
            });
        }
        if (callback) callback();
    }
};
