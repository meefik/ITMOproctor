var config = require('nconf').file('../config.json');
var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongoose:uri'));
var moment = require('moment');
var conn = mongoose.connection;
conn.on('error', function(err) {
    console.error("MongoDB connection error:", err.message);
});
conn.once('open', function() {
    console.info("MongoDB is connected.");
    db.generator();
});
var User = require('./models/user');
var Exam = require('./models/exam');
var Passport = require('./models/passport');
var Subject = require('./models/subject');
var db = {
    save: function(obj) {
        obj.save(function(err, data) {
            if(err) console.log(err);
        });
    },
    generator: function() {
        var self = this;
        var data = require('./data.json');
        User.remove({}, function(err) {
            var items = data.user;
            for(var k in items) {
                var obj = new User(items[k]);
                self.save(obj);
            }
        });
        Passport.remove({}, function(err) {
            var items = data.passport;
            for(var k in items) {
                var obj = new Passport(items[k]);
                self.save(obj);
            }
        });
        Subject.remove({}, function(err) {
            var items = data.subject;
            for(var k in items) {
                var obj = new Subject(items[k]);
                self.save(obj);
            }
        });
        Exam.remove({}, function(err) {
            var items = data.exam;
            for(var k in items) {
                var d = moment().add((k-1)*5,'hours');
                items[k].beginDate = moment(d).add(5,'minutes');
                items[k].endDate = moment(d).add(4,'hours');
                var obj = new Exam(items[k]);
                self.save(obj);
            }
        });
    }
};
//
// Disconnect
//
setTimeout(function() {
    mongoose.disconnect();
}, 5000);