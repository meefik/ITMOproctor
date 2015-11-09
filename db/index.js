var logger = require('../logger');
var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongoose:uri'));
var conn = mongoose.connection;
var Grid = require('gridfs-stream');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var db = {
    geoip: function(ip) {
        var geoip = require('geoip-lite');
        var geo = geoip.lookup(ip) || {};
        return geo;
    },
    profile: {
        auth: {
            local: function(username, password, done) {
                var User = require('./models/user');
                User.findOne({
                    username: username
                }).select("+hashedPassword +salt").exec(function(err, user) {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        return done(null, false, {
                            message: 'Incorrect username.'
                        });
                    }
                    if (!user.isActive()) {
                        return done(null, false, {
                            message: 'User is inactive.'
                        });
                    }
                    if (!user.validPassword(password)) {
                        return done(null, false, {
                            message: 'Incorrect password.'
                        });
                    }
                    return done(null, user);
                });
            },
            openedu: function(accessToken, refreshToken, prof, done) {
                var userData = {
                    username: prof.username,
                    firstname: prof.firstname,
                    lastname: prof.lastname,
                    email: prof.email,
                    password: null
                };
                var User = require('./models/user');
                User.findOne({
                    username: userData.username
                }).exec(function(err, data) {
                    if (err) {
                        return done(err);
                    }
                    if (!data) {
                        var user = new User(userData);
                        user.save(function(err, data) {
                            return done(err, data);
                        });
                    }
                    else {
                        if (!data.isActive()) {
                            return done(null, false, {
                                message: 'User is inactive.'
                            });
                        }
                        return done(null, data);
                    }
                });
            },
            ifmosso: function(prof, done) {
                var userData = {
                    username: prof.ssoid,
                    firstname: prof.firstname,
                    lastname: prof.lastname,
                    middlename: prof.middlename,
                    gender: prof.gender,
                    birthday: prof.birthdate,
                    email: prof.email,
                    password: null
                };
                var User = require('./models/user');
                User.findOne({
                    username: userData.username
                }).exec(function(err, data) {
                    if (err) {
                        return done(err);
                    }
                    if (!data) {
                        var user = new User(userData);
                        user.save(function(err, data) {
                            return done(err, data);
                        });
                    }
                    else {
                        if (!data.isActive()) {
                            return done(null, false, {
                                message: 'User is inactive.'
                            });
                        }
                        return done(null, data);
                    }
                });
            }
        },
        log: function(args, callback) {
            var Logger = require('./models/logger');
            var log = new Logger({
                user: args.userId,
                ip: args.ip
            });
            log.save(callback);
        },
        info: function(args, callback) {
            var User = require('./models/user');
            User.findById(args.userId).exec(callback);
        },
        update: function(args, callback) {
            var User = require('./models/user');
            var attach = args.data.attach || [];
            var attachAdd = [];
            var attachDel = [];
            for (var i = 0; i < attach.length; i++) {
                if (!attach[i].fileId) {
                    attach[i].fileId = mongoose.Types.ObjectId();
                    attachAdd.push(attach[i]);
                }
                if (attach[i].removed) {
                    attachDel.push(attach[i]);
                    attach.splice(i, 1);
                }
            }
            User.findByIdAndUpdate(args.userId, {
                $set: args.data
            }, {
                'new': true
            }, function(err, data) {
                callback(err, data);
                if (!err && data) {
                    if (attachAdd.length > 0) {
                        db.storage.upload(attachAdd);
                    }
                    if (attachDel.length > 0) {
                        db.storage.remove(attachDel);
                    }
                };
            });
        }
    },
    storage: {
        upload: function(files, callback) {
            files.forEach(function(file, i, arr) {
                var fullname = path.join('uploads', path.basename(file.uploadname));
                fs.exists(fullname, function(exists) {
                    if (!exists) return;
                    var writestream = db.gfs.createWriteStream({
                        _id: file.fileId,
                        filename: file.filename
                    });
                    fs.createReadStream(fullname).pipe(writestream);
                    writestream.on('close', function(data) {
                        if (callback) callback(data);
                        fs.unlink(fullname);
                    });
                });
            });
        },
        download: function(fileId, callback) {
            db.gfs.findOne({
                _id: fileId
            }, function(err, data) {
                if (!err && data) {
                    var readstream = db.gfs.createReadStream({
                        _id: fileId
                    });
                    readstream.pipe(callback(data));
                }
                else {
                    callback();
                }
            });
        },
        remove: function(files, callback) {
            if (!callback) callback = function(err) {};
            files.forEach(function(file, i, arr) {
                db.gfs.remove({
                    _id: file.fileId
                }, callback);
            });
        }
    },
    exam: {
        list: function(args, callback) {
            var Exam = require('./models/exam');
            var query = {
                student: args.userId
            };
            Exam.find(query).sort('beginDate').exec(callback);
        },
        search: function(args, callback) {
            var rows = args.rows ? parseInt(args.rows) : 100;
            var page = args.page ? parseInt(args.page) - 1 : 0;
            var status = args.status;
            var fromDate = args.from ? moment(args.from) : null;
            var toDate = args.to ? moment(args.to) : null;
            var text = args.text ? args.text.trim().split(' ') : null;
            var merge = require('merge');
            var query = {};
            // Date
            if (fromDate && toDate) {
                var q = {
                    beginDate: {
                        "$lt": toDate
                    },
                    endDate: {
                        "$gt": fromDate
                    }
                };
                query = merge.recursive(true, query, q);
            }
            // Status: all, process, away
            switch (status) {
                case '1':
                    //console.log('Все');
                    break;
                case '2':
                    //console.log('Идет экзамен');
                    var q = {
                        startDate: {
                            "$ne": null
                        },
                        stopDate: {
                            "$eq": null
                        },
                        inspector: {
                            "$ne": null
                        }
                    };
                    query = merge.recursive(true, query, q);
                    break;
                case '3':
                    //console.log('Ожидают');
                    var q = {
                        beginDate: {
                            "$lte": moment()
                        },
                        endDate: {
                            "$gt": moment()
                        },
                        inspector: {
                            "$eq": null
                        }
                    };
                    query = merge.recursive(true, query, q);
                    break;
            }
            // Populate options
            var opts = [{
                path: 'student',
                select: 'firstname lastname middlename'
            }, {
                path: 'inspector',
                select: 'firstname lastname middlename'
            }];
            // Query
            var Exam = require('./models/exam');
            if (text) {
                // Full text search
                Exam.find(query).sort('beginDate').populate(opts).exec(function(err, data) {
                    if (err || !data) return callback(err, null);
                    var out = [];
                    var dl = data.length;
                    for (var i = 0; i < dl; i++) {
                        var item = data[i];
                        if (!item.inspector) item.inspector = {};
                        var arr = [item.subject,
                            item.student.lastname, item.student.firstname, item.student.middlename,
                            item.inspector.lastname, item.inspector.firstname, item.inspector.middlename
                        ];
                        var cond = true;
                        for (var k = 0; k < text.length; k++) {
                            var match = false;
                            for (var j = 0; j < arr.length; j++) {
                                var str = new String(arr[j]).toLowerCase();
                                var sub = new String(text[k]).toLowerCase();
                                if (str.indexOf(sub) > -1) {
                                    match = true;
                                    break;
                                }
                            }
                            cond = cond && match;
                            if (!cond) break;
                        }
                        if (cond) out.push(item);
                    }
                    var begin = rows * page;
                    var end = begin + rows;
                    callback(err, out.slice(begin, end), out.length);
                });
            }
            else {
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
                path: 'student',
                select: 'firstname lastname middlename birthday'
            }, {
                path: 'inspector',
                select: 'firstname lastname middlename'
            }];
            Exam.findById(args.examId).populate(opts).exec(callback);
        },
        update: function(args, callback) {
            var Exam = require('./models/exam');
            var Schedule = require('./models/schedule');
            Exam.findOne({
                _id: args.examId,
                student: args.userId
            }).exec(function(err, exam) {
                if (err || !exam) return callback(err, exam);
                var beginDate = moment(args.beginDate);
                var endDate = moment(beginDate).add(exam.duration, 'hours');
                var timetable = {};
                // find schedules with working time around beginDate, end of working time >= endDate
                Schedule.find({
                    '$and': [{
                        beginDate: {
                            '$lte': beginDate
                        }
                    }, {
                        endDate: {
                            '$gte': endDate
                        }
                    }]
                }).exec(function(err, schedule) {
                    if (err || !schedule.length) return callback(err, schedule);
                    for (var i = 0, li = schedule.length; i < li; i++) {
                        var inspector = schedule[i].inspector;
                        var concurrent = schedule[i].concurrent;
                        timetable[inspector] = concurrent;
                    }
                    console.log(timetable);
                    // find exams with time around beginDate
                    Exam.find({
                        '$and': [{
                            beginDate: {
                                '$lt': endDate
                            }
                        }, {
                            endDate: {
                                '$gt': beginDate
                            }
                        }]
                    }).exec(function(err, exams) {
                        if (err) return callback(err, exams);
                        for (var i = 0, li = exams.length; i < li; i++) {
                            var inspector = exams[i].inspector;
                            if (timetable[inspector]) {
                                timetable[inspector]--;
                                if (timetable[inspector] <= 0) delete timetable[inspector];
                            }
                        }
                        console.log(timetable);
                        var inspectors = Object.getOwnPropertyNames(timetable);
                        var amount = inspectors.length;
                        if (!amount) return callback();
                        Exam.update({
                            _id: args.examId
                        }, {
                            "$set": {
                                inspector: inspectors[Math.floor(Math.random() * amount)], // для честного распределения времени инспекторов
                                beginDate: beginDate,
                                endDate: endDate
                            }
                        }, function(err, data) {
                            callback(err, data);
                        });
                    });
                });

            });
        },
        schedule: function(args, callback) {
            var Exam = require('./models/exam');
            var Schedule = require('./models/schedule');
            var duration = Number(args.duration);
            var leftDate = moment(args.leftDate).set({
                'minute': 0,
                'second': 0,
                'millisecond': 0
            });
            var rightDate = moment(args.rightDate).set({
                'minute': 0,
                'second': 0,
                'millisecond': 0
            });
            var timetable = {};
            Schedule.find({
                '$and': [{
                    beginDate: {
                        '$lt': rightDate
                    }
                }, {
                    endDate: {
                        '$gt': leftDate
                    }
                }]
            }).exec(function(err, schedule) {
                if (err) return callback(err, schedule);
                // формируем таблицу доступных рабочих часов каждого инспектора
                for (var i = 0, li = schedule.length; i < li; i++) {
                    var inspector = schedule[i].inspector;
                    var beginDate = moment(schedule[i].beginDate);
                    var endDate = moment(schedule[i].endDate);
                    var concurrent = schedule[i].concurrent;
                    if (!timetable[inspector]) timetable[inspector] = [];
                    var start = beginDate.diff(leftDate, 'hours');
                    var times = moment.min(rightDate, endDate).diff(beginDate, 'hours');
                    for (var j = start < 0 ? 0 : start, lj = start + times; j < lj; j++) {
                        if (!timetable[inspector][j]) timetable[inspector][j] = concurrent;
                    }
                }
                console.log(timetable);
                Exam.find({
                    '$and': [{
                        beginDate: {
                            '$lt': rightDate
                        }
                    }, {
                        endDate: {
                            '$gt': leftDate
                        }
                    }]
                }).exec(function(err, exams) {
                    if (err) return callback(err, exams);
                    // исключаем из таблицы уже запланированные экзамены
                    for (var i = 0, li = exams.length; i < li; i++) {
                        var inspector = exams[i].inspector;
                        var beginDate = moment(exams[i].beginDate);
                        var endDate = moment(exams[i].endDate);
                        var start = beginDate.diff(leftDate, 'hours');
                        var times = moment.min(rightDate, endDate).diff(beginDate, 'hours');
                        for (var j = start < 0 ? 0 : start, lj = start + times; j < lj; j++) {
                            if (timetable[inspector]) timetable[inspector][j]--;
                        }
                    }
                    console.log(timetable);
                    // определяем доступные для записи часы с учетом duration
                    var out = [];
                    for (var k in timetable) {
                        var arr = timetable[k];
                        var seq = 0;
                        for (var m = 0, lm = arr.length; m < lm; m++) {
                            if (!arr[m] > 0) seq = 0;
                            else if (++seq >= duration) {
                                var n = m - duration + 1;
                                out.push(n);
                            }
                        }
                    }
                    console.log(out);
                    // сортируем, исключаем повторы и преобразуем в даты
                    var dates = out.sort().filter(function(item, pos, arr) {
                        return !pos || item != arr[pos - 1];
                    }).map(function(v) {
                        return moment(leftDate).add(v, 'hours');
                    });
                    callback(null, dates);
                });
            });
        }
    },
    vision: {
        start: function(args, callback) {
            var opts = [{
                path: 'student',
                select: 'firstname lastname middlename'
            }, {
                path: 'inspector',
                select: 'firstname lastname middlename'
            }];
            var Exam = require('./models/exam');
            Exam.findById(args.examId).populate(opts).exec(function(err, exam) {
                callback(err, exam);
                if (!err && exam) {
                    // set startDate
                    if (!exam.startDate) {
                        Exam.update({
                            _id: args.examId
                        }, {
                            "$set": {
                                startDate: moment(),
                            }
                        }, function(err, data) {
                            if (err) console.log(err);
                        });
                    }
                    // set inspector
                    if (args.userId != exam.student._id) {
                        Exam.update({
                            _id: args.examId
                        }, {
                            "$set": {
                                inspector: args.userId
                            }
                        }, function(err, data) {
                            if (err) console.log(err);
                        });
                    }
                }
            });
        },
        finish: function(args, callback) {
            var Exam = require('./models/exam');
            Exam.findOneAndUpdate({
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
            Note.find({
                exam: args.examId
            }).sort('time').exec(callback);
        },
        add: function(args, callback) {
            for (var i = 0; i < args.attach.length; i++) {
                args.attach[i].fileId = mongoose.Types.ObjectId();
            }
            var Note = require('./models/note');
            var note = new Note({
                exam: args.examId,
                author: args.author,
                text: args.text,
                attach: args.attach
            });
            note.save(function(err, data) {
                callback(err, data);
                if (args.attach.length > 0) {
                    db.storage.upload(args.attach);
                }
            });
        },
        update: function(args, callback) {
            var Note = require('./models/note');
            Note.update({
                _id: args.noteId
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
                _id: args.noteId
            }, function(err, data) {
                callback(err, data);
                if (!err && data) {
                    if (data.attach.length > 0) {
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
            Chat.find({
                exam: args.examId
            }).populate(opts).sort('time').exec(callback);
        },
        add: function(args, callback) {
            for (var i = 0; i < args.attach.length; i++) {
                args.attach[i].fileId = mongoose.Types.ObjectId();
            }
            var Chat = require('./models/chat');
            var chat = new Chat({
                exam: args.examId,
                author: args.author,
                text: args.text,
                attach: args.attach
            });
            chat.save(function(err, data) {
                if (err || !data) callback(err, data);
                else {
                    Chat.populate(data, {
                        path: 'author',
                        select: 'firstname lastname middlename'
                    }, callback);
                    if (args.attach.length > 0) {
                        db.storage.upload(args.attach);
                    }
                }
            });
        }
    },
    protocol: {
        list: function(args, callback) {
            var Protocol = require('./models/protocol');
            Protocol.find({
                exam: args.examId
            }).sort('time').exec(callback);
        },
        add: function(args, callback) {
            var Protocol = require('./models/protocol');
            var protocol = new Protocol({
                exam: args.examId,
                text: args.text
            });
            protocol.save(callback);
        }
    },
    members: {
        list: function(args, callback) {
            var Member = require('./models/member');
            // Populate options
            var opts = [{
                path: 'user',
                select: 'firstname lastname middlename role roleName'
            }, {
                path: 'exam',
                select: 'student inspector'
            }];
            Member.find({
                exam: args.examId
            }).sort('time').populate(opts).exec(callback);
        },
        update: function(args, callback) {
            var geo = db.geoip(args.ip);
            var Member = require('./models/member');
            Member.findOneAndUpdate({
                exam: args.examId,
                user: args.userId
            }, {
                exam: args.examId,
                user: args.userId,
                time: Date.now(),
                ip: args.ip,
                country: geo.country,
                city: geo.city
            }, {
                upsert: true
            }, callback);
        }
    }
}
conn.on('error', function(err) {
    logger.error("MongoDB connection error: " + err.message);
});
conn.once('open', function() {
    logger.info("MongoDb is connected");
    db.gfs = Grid(conn.db, mongoose.mongo);
});
db.mongoose = mongoose;
module.exports = db;