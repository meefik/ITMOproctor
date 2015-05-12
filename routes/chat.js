var express = require('express');
var router = express.Router();
var moment = require('moment');
var dao = require('../db/dao');
// List all messages
router.get('/', function(req, res) {
    var args = {
        examId: req.user.examId
    };
    dao.chat.list(args, function(err, data) {
        if(!err && data) {
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
// Create new message
router.post('/', function(req, res) {
    var args = {
        author: req.user._id,
        examId: req.user.examId,
        text: req.body.text
    };
    dao.chat.add(args, function(err, data) {
        if(!err && data) {
            req.notify('chat');
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
module.exports = router;