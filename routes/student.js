var express = require('express');
var router = express.Router();
var db = require('../db');

router.get('/', function(req, res) {
    var args = {
        userId: req.user._id,
        username: req.user.username,
        accountType: req.user.accountType
    };
    var api = require('../common/api');
    api.fetchExams(args, function() {
        db.exam.list(args, function(err, data) {
            if (!err) {
                res.json(data);
            }
            else {
                res.status(400).end();
            }
        });
    });
});
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    };
    db.exam.info(args, function(err, data) {
        if (!err && data) {
            res.json(data);
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
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    db.exam.start(args, function(err, data) {
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
});
module.exports = router;