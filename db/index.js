var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongoose:uri'));
var conn = mongoose.connection;
var Grid = require('gridfs-stream');
//Grid.mongo = mongoose.mongo;
var moment = require('moment');
var db = {
    auth: function(username, password, done) {
        var User = require('./models/user');
        User.findOne({
            username: username
        }).select("+hashedPassword +salt").exec(function(err, user) {
            if(err) {
                return done(err);
            }
            if(!user) {
                return done(null, false, {
                    message: 'Incorrect username.'
                });
            }
            if(!user.validPassword(password)) {
                return done(null, false, {
                    message: 'Incorrect password.'
                });
            }
            return done(null, user);
        });
    },
    monitor: {
        list: function(args, callback) {
            var rows = args.rows ? parseInt(args.rows) : 100;
            var page = args.page ? parseInt(args.page) - 1 : 0;
            var status = args.status;
            var date = args.date ? moment(args.date, 'DD.MM.YYYY') : null;
            var text = args.text;
            var merge = require('merge');
            var query = {};
            // Date
            if(date) {
                var q = {
                    beginDate: {
                        "$gte": moment(date),
                        "$lte": moment(date).add(1, 'days')
                    }
                };
                query = merge.recursive(true, query, q);
            }
            // Status: all, process, away
            switch(status) {
                case '1':
                    //console.log('Все');
                    break;
                case '2':
                    //console.log('Идет экзамен');
                    var q = {
                        beginDate: {
                            "$lte": moment()
                        },
                        endDate: {
                            "$gte": moment()
                        }
                    };
                    query = merge.recursive(true, query, q);
                    break;
                case '3':
                    //console.log('Ожидают');
                    var q = {
                        beginDate: {
                            "$gt": moment()
                        }
                    };
                    query = merge.recursive(true, query, q);
                    break;
            }
            // Full text search
            if(text) {
                // client side
                console.log(text);
            }
            // Populate options
            var opts = [{
                path: 'subject'
            }, {
                path: 'student',
                select: 'firstname lastname middlename'
            }, {
                path: 'curator',
                select: 'firstname lastname middlename'
            }];
            // Query
            var Exam = require('./models/exam');
            Exam.find(query).count(function(err, count) {
                Exam.find(query).sort('beginDate').skip(rows * page).limit(rows).populate(opts).exec(function(err, data) {
                    callback(err, data, count);
                });
            });
        },
        info: function(args, callback) {
            var Exam = require('./models/exam');
            // get data
            var opts = [{
                path: 'subject'
            }, {
                path: 'student'
            }, {
                path: 'curator'
            }];
            Exam.findById(args.examId).populate(opts).exec(callback);
        }
    },
    vision: {
        start: function(args, callback) {
            var opts = [{
                path: 'subject'
            }, {
                path: 'student'
            }, {
                path: 'curator'
            }];
            var Exam = require('./models/exam');
            var Passport = require('./models/passport');
            Exam.findById(args.examId).populate(opts).exec(function(err, exam) {
                if(err || !exam) {
                    callback(err, exam);
                } else {
                    //console.log(exam);
                    var data = exam.toJSON();
                    Passport.findOne({
                        userId: data.student._id
                    }).exec(function(err, passport) {
                        if(err) data.passport = null;
                        else {
                            data.passport = passport;
                        }
                        callback(err, data);
                    });
                    Exam.update({
                        _id: args.examId
                    }, {
                        $set: {
                            startDate: exam.startDate || moment().toJSON(),
                        },
                        $addToSet: {
                            curator: args.userId
                        }
                    }, function(err, data) {
                        if(err) console.log(err);
                    });
                }
            });
        },
        finish: function(args, callback) {
            var Exam = require('./models/exam');
            Exam.update({
                _id: args.examId
            }, {
                $set: {
                    stopDate: moment(),
                    resolution: args.resolution,
                    comment: args.comment
                }
            }, callback);
        }
    },
    notes: {
        list: function(args, callback) {
            var Note = require('./models/note');
            Note.find(args).sort('time').exec(callback);
        },
        add: function(args, callback) {
            var Note = require('./models/note');
            var note = new Note(args);
            note.save(callback);
        },
        get: function(args, callback) {
            // get note by id
        },
        update: function(args, callback) {
            var Note = require('./models/note');
            Note.update({
                _id: args._id
            }, {
                $set: {
                    author: args.author,
                    text: args.text
                }
            }, callback);
        },
        delete: function(args, callback) {
            var Note = require('./models/note');
            Note.remove({
                _id: args._id
            }, callback);
        }
    },
    chat: {
        list: function(args, callback) {
            var Chat = require('./models/chat');
            // Populate options
            var opts = [{
                path: 'author',
                select: 'firstname lastname middlename'
            }];
            Chat.find(args).populate(opts).sort('time').exec(callback);
        },
        add: function(args, callback) {
            var Chat = require('./models/chat');
            var User = require('./models/user');
            var chat = new Chat(args);
            chat.save(function(err, data) {
                if(err || !data) callback(err, data);
                else {
                    Chat.populate(data, {
                        path: 'author',
                        select: 'firstname lastname middlename'
                    }, callback);
                }
            });
        }
    },
    protocol: {
        list: function(args, callback) {
            var Protocol = require('./models/protocol');
            Protocol.find(args).sort('time').exec(callback);
        }
    }
}
conn.on('error', function(err) {
    console.error("MongoDB connection error:", err.message);
});
conn.once('open', function() {
    console.info("MongoDB is connected.");
    db.gfs = Grid(conn.db, mongoose.mongo);
});
db.mongoose = mongoose;
module.exports = db;