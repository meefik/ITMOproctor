var config = require('nconf').file('./config.json');
var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongoose:uri'));
var conn = mongoose.connection;
conn.on('error', function(err) {
    console.error("MongoDB connection error:", err.message);
});
conn.once('open', function() {
    console.info("MongoDB is connected.");
    db.generator();
});
var User = require('./db/models/user');
var Exam = require('./db/models/exam');
var Passport = require('./db/models/passport');
var Subject = require('./db/models/subject');
var db = {
    insert: {
        saveUser: function(user){
            var userToSave = user//JSON.parse(user);
            var u = new User(userToSave);
            u.save(function(err, data) {
                if(err) console.log(err);
            });            
        },
        saveExam: function(exam){
            var examToSave = exam//JSON.parse(exam);
            var ex = new Exam(examToSave);
            ex.save(function(err, data) {
                if(err) console.log(err);
            });
        },
        savePassport: function(pass){            
            var passToSave = pass//JSON.parse(pass);
            var ex = new Passport(passToSave);
            ex.save(function(err, data) {
                if(err) console.log(err);
            });
        },
        saveSubject: function(subj){       
            var subjToSave = subj//JSON.parse(subj);
            var subject = new Subject(subjToSave);
            subject.save(function(err, data) {
                if(err) console.log(err);
            });
        }
    },
    generator: function(){
        var data = require("./data.json");
        //this.insert.savePassport(JSON.stringify(data.passports));
        this.insert.savePassport(data.passport);
    }
};

//
// Disconnect
//
setTimeout(function() {
    mongoose.disconnect();
}, 5000);
