var logger = require('../common/logger');
var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongoose:uri'));
var conn = mongoose.connection;
var Grid = require('gridfs-stream');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
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
            openedu: function(prof, done) {
                var userData = {
                    username: prof.username,
                    firstname: prof.firstname,
                    lastname: prof.lastname,
                    email: prof.email,
                    password: null,
                    provider: config.get('auth:openedu:provider') || 'openedu'
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
                    genderId: prof.gender,
                    birthday: prof.birthdate,
                    email: prof.email,
                    password: null,
                    provider: config.get('auth:ifmosso:provider') || 'ifmosso'
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
                else if (attach[i].removed) {
                    attachDel.push(attach[i]);
                    attach.splice(i, 1);
                    i--;
                }
            }
            User.findByIdAndUpdate(args.userId, {
                '$set': args.data
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
                }
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
            if (!callback) callback = function() {};
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
            var query;
            if (args.history) {
                query = {
                    student: args.userId
                };
            }
            else {
                var now = moment();
                query = {
                    '$and': [{
                        student: args.userId
                    }, {
                        rightDate: {
                            '$gt': now
                        }
                    }, {
                        '$or': [{
                            endDate: null
                        }, {
                            endDate: {
                                '$gt': now
                            }
                        }]
                    }]
                };
            }
            Exam.find(query).sort('beginDate').exec(callback);
        },
        search: function(args, callback) {
            var rows = args.rows ? Number(args.rows) : 100;
            var page = args.page ? Number(args.page) - 1 : 0;
            var myself = args.myself;
            var fromDate = args.from ? moment(args.from) : null;
            var toDate = args.to ? moment(args.to) : null;
            var query = {};
            // Date
            if (fromDate && toDate) {
                query.beginDate = {
                    "$lt": toDate
                };
                query.endDate = {
                    "$gt": fromDate
                };
            }
            // If myself
            if (myself) {
                query.inspector = args.userId;
            }
            // Populate options
            var opts = [{
                path: 'student',
                select: 'username firstname lastname middlename'
            }, {
                path: 'inspector',
                select: 'username firstname lastname middlename'
            }];
            // Query
            var Exam = require('./models/exam');
            Exam.count(query, function(err, count) {
                if (err || !count) return callback(err);
                Exam.find(query).sort('beginDate').skip(rows * page).limit(rows).populate(opts).exec(function(err, data) {
                    callback(err, data, count);
                });
            });
        },
        info: function(args, callback) {
            var Exam = require('./models/exam');
            // get data
            var opts = [{
                path: 'student',
                select: 'provider firstname lastname middlename birthday'
            }, {
                path: 'inspector',
                select: 'firstname lastname middlename'
            }];
            Exam.findById(args.examId).populate(opts).exec(callback);
        },
        plan: function(args, callback) {
            var Exam = require('./models/exam');
            Exam.findOne({
                _id: args.examId,
                student: args.userId
            }).exec(function(err, exam) {
                if (err || !exam) return callback(err);
                var beginDate = moment(args.beginDate);
                var interval = Number(config.get('schedule:interval'));
                var duration = Number(exam.duration);
                var endDate = moment(beginDate).add(duration + interval, 'minutes');
                db.exam.schedule({
                    leftDate: beginDate,
                    rightDate: endDate,
                    duration: duration
                }, function(err, data) {
                    if (err || !data) return callback(err);
                    var amount = data.inspectors.length;
                    if (!amount) return callback();
                    Exam.update({
                        _id: args.examId
                    }, {
                        '$set': {
                            // для честного распределения времени инспекторов
                            inspector: data.inspectors[Math.floor(Math.random() * amount)],
                            beginDate: beginDate,
                            endDate: endDate,
                            planDate: moment()
                        }
                    }, function(err, data) {
                        callback(err, data);
                    });
                });
            });
        },
        schedule: function(args, callback) {
            var Exam = require('./models/exam');
            var Schedule = require('./models/schedule');
            var interval = Number(config.get('schedule:interval'));
            var duration = Math.ceil((Number(args.duration) + interval) / 60);
            var offset = Number(config.get('schedule:offset'));
            var now = moment().add(offset, 'hours');
            var leftDate = moment.max(now, moment(args.leftDate)).startOf('hour');
            var rightDate = moment(args.rightDate).add(1, 'hours').startOf('hour');
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
            }).exec(function(err, schedules) {
                if (err) return callback(err);
                // формируем таблицу доступных рабочих часов каждого инспектора
                for (var i = 0, li = schedules.length; i < li; i++) {
                    var inspector = schedules[i].inspector;
                    var beginDate = moment(schedules[i].beginDate);
                    var endDate = moment(schedules[i].endDate);
                    var concurrent = schedules[i].concurrent;
                    if (!timetable[inspector]) timetable[inspector] = [];
                    var start = beginDate.diff(leftDate, 'hours');
                    var times = moment.min(rightDate, endDate).diff(beginDate, 'hours', true);
                    for (var j = start < 0 ? 0 : start, lj = start + times; j < lj; j++) {
                        if (timetable[inspector][j]) timetable[inspector][j] += concurrent;
                        else timetable[inspector][j] = concurrent;
                    }
                }
                //console.log(timetable);
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
                    if (err) return callback(err);
                    // исключаем из таблицы уже запланированные экзамены
                    for (var i = 0, li = exams.length; i < li; i++) {
                        var inspector = exams[i].inspector;
                        var beginDate = moment(exams[i].beginDate);
                        var endDate = moment(exams[i].endDate);
                        var start = beginDate.diff(leftDate, 'hours');
                        var times = moment.min(rightDate, endDate).diff(beginDate, 'hours', true);
                        for (var j = start < 0 ? 0 : start, lj = start + times; j < lj; j++) {
                            if (timetable[inspector] && timetable[inspector][j] > 0) timetable[inspector][j]--;
                        }
                    }
                    //console.log(timetable);
                    // определяем доступные для записи часы с учетом duration
                    var hours = [];
                    var inspectors = [];
                    for (var inspector in timetable) {
                        var arr = timetable[inspector];
                        var seq = 0;
                        var available = false;
                        for (var m = 0, lm = arr.length; m < lm; m++) {
                            if (!arr[m] > 0) seq = 0;
                            else if (++seq >= duration) {
                                var n = m + 1 - duration;
                                hours.push(n);
                                available = true;
                            }
                        }
                        if (available) inspectors.push(inspector);
                    }
                    //console.log(hours);
                    // сортируем, исключаем повторы и преобразуем в даты
                    var dates = hours.sort(function(a, b) {
                        return a - b;
                    }).filter(function(item, pos, arr) {
                        return !pos || item != arr[pos - 1];
                    }).map(function(v) {
                        return moment(leftDate).add(v, 'hours');
                    });
                    //callback(null, dates);
                    callback(null, {
                        dates: dates,
                        inspectors: inspectors
                    });
                });
            });
        },
        cancel: function(args, callback) {
            var Exam = require('./models/exam');
            var offset = Number(config.get('schedule:offset'));
            var now = moment().add(offset, 'hours').startOf('hour');
            Exam.findOneAndUpdate({
                _id: args.examId,
                student: args.userId,
                beginDate: {
                    '$gte': now
                }
            }, {
                '$set': {
                    beginDate: null,
                    endDate: null,
                    inspector: null
                }
            }, {
                'new': true
            }).exec(callback);
        },
        add: function(args, callback) {
            var Exam = require('./models/exam');
            var isExamExist = function(examId, arr) {
                for (var i = 0, li = arr.length; i < li; i++) {
                    if (examId == arr[i].examId) {
                        return true;
                    }
                }
                return false;
            };
            Exam.find({
                student: args.userId
            }).exec(function(err, exams) {
                if (err || !exams) return callback(err);
                var proctored = args.exams;
                var appends = [];
                for (var i = 0, li = proctored.length; i < li; i++) {
                    if (!isExamExist(proctored[i].examId, exams)) {
                        appends.push({
                            //_id: mongoose.Types.ObjectId(),
                            examId: proctored[i].examId,
                            student: args.userId,
                            subject: proctored[i].subject,
                            duration: proctored[i].duration,
                            leftDate: proctored[i].leftDate,
                            rightDate: proctored[i].rightDate
                        });
                    }
                }
                if (!appends.length) return callback();
                var saved = 0;
                for (var j = 0, lj = appends.length; j < lj; j++) {
                    var exam = new Exam(appends[j]);
                    exam.save(function(err, data) {
                        if (err) logger.warn(err);
                        if (++saved === lj) return callback();
                    });
                }
            });
        },
        updateCode: function(args, callback) {
            var User = require('./models/user');
            var Exam = require('./models/exam');
            User.findOne({
                username: args.username,
                provider: args.provider
            }).exec(function(err, user) {
                if (err || !user) return callback(err);
                Exam.findOneAndUpdate({
                    examId: args.examId,
                    student: user._id
                }, {
                    '$set': {
                        examCode: args.examCode
                    }
                }, {
                    'new': true
                }).exec(callback);
            });
        },
        start: function(args, callback) {
            var opts = [{
                path: 'student',
                select: 'provider firstname lastname middlename gender birthday citizenship documentType documentNumber documentIssueDate description'
            }, {
                path: 'inspector',
                select: 'firstname lastname middlename'
            }];
            var Exam = require('./models/exam');
            Exam.findById(args.examId).exec(function(err, exam) {
                if (err || !exam) return callback(err);
                var query = {};
                if (!exam.startDate && exam.student == args.userId) {
                    query.startDate = moment();
                }
                if (!exam.inspector && exam.student != args.userId) {
                    query.inspector = args.userId;
                }
                if (!query) return callback();
                Exam.findByIdAndUpdate(args.examId, {
                    '$set': query
                }, {
                    'new': true
                }).populate(opts).exec(callback);

            });
        },
        finish: function(args, callback) {
            var Exam = require('./models/exam');
            Exam.findOneAndUpdate({
                _id: args.examId,
                inspector: args.userId
            }, {
                '$set': {
                    stopDate: moment(),
                    resolution: args.resolution,
                    comment: args.comment
                }
            }).exec(callback);
        },
        verify: function(args, callback) {
            if (!args.verified) return callback();
            var Exam = require('./models/exam');
            var hash = crypto.createHash('md5').update(JSON.stringify(args.verified.data)).digest('hex');
            Exam.findOneAndUpdate({
                _id: args.examId,
                inspector: args.userId
            }, {
                '$set': {
                    'verified.submit': args.verified.submit,
                    'verified.data': args.verified.data,
                    'verified.hash': hash
                }
            }).exec(callback);
        }
    },
    schedule: {
        list: function(args, callback) {
            var Schedule = require('./models/schedule');
            Schedule.find({
                inspector: args.inspector,
                endDate: {
                    '$gte': moment()
                }
            }).sort('beginDate').exec(callback);
        },
        add: function(args, callback) {
            var Schedule = require('./models/schedule');
            var beginDate = moment(args.beginDate).startOf('hour');
            var endDate = moment(args.endDate).startOf('hour');
            var offset = Number(config.get('schedule:offset'));
            var now = moment().add(offset, 'hours').startOf('hour');
            if (beginDate >= endDate || beginDate < now ||
                args.concurrent < 1) return callback();
            var schedule = new Schedule({
                inspector: args.inspector,
                beginDate: beginDate,
                endDate: endDate,
                concurrent: args.concurrent
            });
            schedule.save(callback);
        },
        remove: function(args, callback) {
            var Schedule = require('./models/schedule');
            Schedule.findOneAndRemove({
                inspector: args.inspector,
                _id: args.scheduleId
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
                attach: args.attach,
                editable: args.editable
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
                _id: args.noteId,
                editable: true
            }, {
                '$set': {
                    author: args.author,
                    text: args.text
                }
            }, {
                'new': true
            }, callback);
        },
        remove: function(args, callback) {
            var Note = require('./models/note');
            Note.findOneAndRemove({
                _id: args.noteId,
                editable: true
            }, function(err, data) {
                callback(err, data);
                if (!err && data) {
                    if (data.attach.length > 0) {
                        db.storage.remove(data.attach);
                    }
                }
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
    },
    rest: {
        create: function(args, callback) {
            try {
                var model = require('./models/' + args.collection);
                model.create(args.data, callback);
            }
            catch (err) {
                return callback(err);
            }
        },
        read: function(args, callback) {
            try {
                var model = require('./models/' + args.collection);
                var transaction = model.find(args.query);
                if (args.skip) transaction.skip(args.skip);
                if (args.limit) transaction.limit(args.limit);
                if (args.sort) transaction.sort(args.sort);
                if (args.select) transaction.select(args.select);
                if (args.populate) transaction.populate(args.populate);
                transaction.exec(callback);
            }
            catch (err) {
                return callback(err);
            }
        },
        update: function(args, callback) {
            try {
                var model = require('./models/' + args.collection);
                model.findByIdAndUpdate(args.documentId, args.data, {
                    'new': true
                }, callback);
            }
            catch (err) {
                return callback(err);
            }
        },
        delete: function(args, callback) {
            try {
                var model = require('./models/' + args.collection);
                model.findByIdAndRemove(args.documentId, callback);
            }
            catch (err) {
                return callback(err);
            }
        }
    }
};
conn.on('error', function(err) {
    logger.error("MongoDB connection error: " + err.message);
});
conn.once('open', function() {
    logger.info("MongoDb is connected");
    db.gfs = Grid(conn.db, mongoose.mongo);
});
db.mongoose = mongoose;
module.exports = db;
