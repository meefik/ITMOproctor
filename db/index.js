var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongoose:uri'));
var conn = mongoose.connection;
var Grid = require('gridfs-stream');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
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
    storage: {
        upload: function(files, callback) {
            files.forEach(function(file, i, arr) {
                var id = mongoose.Types.ObjectId();
                var fullname = path.join('uploads', path.basename(file.uploadname));
                fs.exists(fullname, function(exists) {
                    if(!exists) return;
                    var writestream = db.gfs.createWriteStream({
                        _id: file.fileId,
                        filename: file.filename
                    });
                    fs.createReadStream(fullname).pipe(writestream);
                    writestream.on('close', function(data) {
                        if(callback) callback(data);
                        fs.unlink(fullname);
                    });
                });
            });
        },
        download: function(fileId, callback) {
            db.gfs.findOne({
                _id: fileId
            }, function(err, data) {
                if(!err && data) {
                    var readstream = db.gfs.createReadStream({
                        _id: fileId
                    });
                    readstream.pipe(callback(data));
                } else {
                    callback();
                }
            });
        },
        remove: function(files, callback) {
            if(!callback) callback = function(err) {};
            files.forEach(function(file, i, arr) {
                db.gfs.remove({
                    _id: file.fileId
                }, callback);
            });
        }
    },
    monitor: {
        list: function(args, callback) {
            var rows = args.rows ? parseInt(args.rows) : 100;
            var page = args.page ? parseInt(args.page) - 1 : 0;
            var status = args.status;
            var date = args.date ? moment(args.date, 'DD.MM.YYYY') : null;
            var text = args.text ? args.text.trim().split(' ') : null;
            var merge = require('merge');
            var query = {};
            // Date
            if(date) {
                var q = {
                    beginDate: {
                        $gte: moment(date),
                        $lte: moment(date).add(1, 'days')
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
                        startDate: {
                            $ne: null
                        },
                        stopDate: {
                            $eq: null
                        },
                        curator: {
                            $not: {
                                $size: 0
                            }
                        }
                    };
                    query = merge.recursive(true, query, q);
                    break;
                case '3':
                    //console.log('Ожидают');
                    var q = {
                        beginDate: {
                            $lte: moment()
                        },
                        endDate: {
                            $gt: moment()
                        },
                        curator: {
                            $size: 0
                        }
                    };
                    query = merge.recursive(true, query, q);
                    break;
            }
            // Populate options
            var opts = [{
                path: 'subject',
                select: 'title code'
            }, {
                path: 'student',
                select: 'firstname lastname middlename'
            }, {
                path: 'curator',
                select: 'firstname lastname middlename'
            }];
            // Query
            var Exam = require('./models/exam');
            if(text) {
                // Full text search
                Exam.find(query).sort('beginDate').populate(opts).exec(function(err, data) {
                    var out = [];
                    var dl = data.length;
                    for(var i = 0; i < dl; i++) {
                        var item = data[i];
                        var curator = {};
                        if(item.curator.length > 0) curator = item.curator[0];
                        var arr = [item.examId,
                            item.student.lastname, item.student.firstname, item.student.middlename,
                            curator.lastname, curator.firstname, curator.middlename,
                            item.subject.title, item.subject.code
                        ];
                        var cond = true;
                        for(var k = 0; k < text.length; k++) {
                            var match = false;
                            var re = new RegExp(text[k], 'i');
                            for(var j = 0; j < arr.length; j++) {
                                if(re.test(arr[j])) {
                                    match = true;
                                    break;
                                }
                            }
                            cond = cond && match;
                            if(!cond) break;
                        }
                        if(cond) out.push(item);
                    }
                    var begin = rows * page;
                    var end = begin + rows;
                    callback(err, out.slice(begin, end), out.length);
                });
            } else {
                Exam.find(query).count(function(err, count) {
                    Exam.find(query).sort('beginDate').skip(rows * page).limit(rows).populate(opts).exec(function(err, data) {
                        callback(err, data, count);
                    });
                });
            }
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
            for(var i = 0; i < args.attach.length; i++) {
                args.attach[i].fileId = mongoose.Types.ObjectId();
            }
            var Note = require('./models/note');
            var note = new Note(args);
            note.save(function(err, data) {
                callback(err, data);
                if(args.attach.length > 0) {
                    db.storage.upload(args.attach);
                }
            });
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
            Note.findOneAndRemove({
                _id: args._id
            }, function(err, data) {
                callback(err, data);
                if(!err && data) {
                    if(data.attach.length > 0) {
                        db.storage.remove(data.attach);
                    }
                };
            });
        }
    },
    chat: {
        list: function(args, callback) {
            var Chat = require('./models/chat');
            // Populate options
            var opts = [{
                path: 'author',
                select: 'firstname lastname middlename',
            }];
            Chat.find(args).populate(opts).sort('time').exec(callback);
        },
        add: function(args, callback) {
            for(var i = 0; i < args.attach.length; i++) {
                args.attach[i].fileId = mongoose.Types.ObjectId();
            }
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
                    if(args.attach.length > 0) {
                        db.storage.upload(args.attach);
                    }
                }
            });
        }
    },
    protocol: {
        list: function(args, callback) {
            var Protocol = require('./models/protocol');
            Protocol.find(args).sort('time').exec(callback);
        }
    },
    student: {
        list: function(args, callback) {
            var opts = [{
                path: 'subject'
            }, {
                path: 'student'
            }, {
                path: 'curator'
            }];
            var Exam = require('./models/exam');
            Exam.find({
                student: args.userId,
                resolution: null,
                beginDate: {
                    $lte: moment().add(1, 'day')
                },
                endDate: {
                    $gte: moment()
                }
            }).sort('beginDate').populate(opts).exec(callback);
        },
        start: function(args, callback) {
            var opts = [{
                path: 'subject'
            }, {
                path: 'student'
            }, {
                path: 'curator'
            }];
            var Exam = require('./models/exam');
            Exam.findById(args.examId).populate(opts).exec(function(err, exam) {
                console.log(exam);
                if(!err && exam) {
                    callback(err, exam);
                    if(!exam.startDate) {
                        Exam.update({
                            _id: exam._id
                        }, {
                            $set: {
                                startDate: moment().toJSON(),
                            }
                        }, function(err, data) {
                            if(err) console.log(err);
                        });
                    }
                } else {
                    callback(err, null);
                }
            });
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