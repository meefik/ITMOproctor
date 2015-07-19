var express = require('express');
var router = express.Router();
var db = require('../db');
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
            req.notify('change-' + args.examId);
            // Log to protocol
            var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            var user = req.user.lastname + ' ' + req.user.firstname + ' ' + req.user.middlename;
            var role = req.user.roleName;
            var text = user + " (" + role + "): " + ip;
            db.protocol.add({examId: args.examId, text: text}, function(err, data) {
                if (err) console.log(err);
                else req.notify('protocol-' + args.examId);
            });
        }
        else {
            res.status(400).end();
        }
    });
});
router.put('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        resolution: req.body.resolution,
        comment: req.body.comment
    }
    db.vision.finish(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('change-' + args.examId);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;