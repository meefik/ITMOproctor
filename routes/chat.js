var express = require('express');
var router = express.Router();
var db = require('../db');
// List all messages
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    };
    db.chat.list(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Create new message
router.post('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        author: req.user._id,
        text: req.body.text,
        attach: req.body.attach
    };
    db.chat.add(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('chat-' + args.examId);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;