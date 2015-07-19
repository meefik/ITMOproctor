var express = require('express');
var router = express.Router();
var db = require('../db');
router.get('/', function(req, res) {
    var args = {
        userId: req.user._id
    }
    db.exam.list(args, function(err, data) {
        if (!err && data.length > 0) {
            res.json(data);
        }
        else {
            res.status(400).end();
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
module.exports = router;