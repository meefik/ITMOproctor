var express = require('express');
var router = express.Router();
var db = require('../db');
// List all events
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    };
    db.protocol.list(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Add exam event to protocol
router.addExamEvent = function(req, res, next) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    var text;
    switch (req.exam.event) {
        case 'connect':
            text = '[' + args.ip + '] ' + req.user.lastname + ' ' +
                req.user.firstname + ' ' + req.user.middlename +
                ' (' + req.user.roleName + ') завершил экзамен.';
            break;
        case 'finish':
            text = '[' + args.ip + '] ' + req.user.lastname + ' ' +
                req.user.firstname + ' ' + req.user.middlename +
                ' (' + req.user.roleName + ') подключился к экзамену.';
            break;
    }
    if (text) {
        db.protocol.add({
            examId: args.examId,
            text: text
        }, function(err, data) {
            if (err) console.log(err);
            if (!err && data) {
                req.notify('protocol-' + args.examId);
            }
        });
    }
    next();
};
module.exports = router;