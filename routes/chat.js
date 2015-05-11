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
        res.json(data);
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
        req.notify('chat');
        res.json(data);
    });
});
module.exports = router;