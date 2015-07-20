var express = require('express');
var router = express.Router();
var db = require('../db');
var protocol = require('./protocol');
router.get('/', function(req, res) {
    var args = {
        rows: req.query.rows,
        page: req.query.page,
        status: req.query.status,
        from: req.query.from,
        to: req.query.to,
        text: req.query.text
    }
    db.exam.search(args, function(err, data, count) {
        if (!err && data) {
            res.json({
                "total": count,
                "rows": data
            });
        }
        else {
            res.json({
                "total": 0,
                "rows": []
            });
        }
    });
});
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }
    db.vision.start(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('members-' + args.examId);
        }
        else {
            res.status(400).end();
        }
    });
});
router.put('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        resolution: req.body.resolution,
        comment: req.body.comment
    }
    if (args.resolution != null) {
        db.vision.finish(args, function(err, data) {
            if (!err && data) {
                res.json(data);
                req.notify('exam-' + args.examId, {
                    userId: args.userId
                });
                // add to protocol
                db.protocol.add({
                    examId: args.examId,
                    text: '[' + args.ip + '] ' + req.user.lastname + ' ' +
                        req.user.firstname + ' ' + req.user.middlename +
                        ' (' + req.user.roleName + ') завершил экзамен.'
                }, function(err, data) {
                    if (err) console.log(err);
                    if (!err && data) {
                        req.notify('protocol-' + args.examId);
                    }
                });
            }
            else {
                res.status(400).end();
            }
        });
    }
    else {
        db.vision.start(args, function(err, data) {
            if (!err && data) {
                res.json(data);
                req.notify('exam-' + args.examId, {
                    userId: args.userId
                });
                // add or update member
                db.members.update(args, function(err, member) {
                    if (err) console.log(err);
                    req.notify('members-' + args.examId);
                });
                // add to protocol
                db.protocol.add({
                    examId: args.examId,
                    text: '[' + args.ip + '] ' + req.user.lastname + ' ' +
                        req.user.firstname + ' ' + req.user.middlename +
                        ' (' + req.user.roleName + ') подключился к экзамену.'
                }, function(err, data) {
                    if (err) console.log(err);
                    if (!err && data) {
                        req.notify('protocol-' + args.examId);
                    }
                });
            }
            else {
                res.status(400).end();
            }
        });
    }
});
module.exports = router;