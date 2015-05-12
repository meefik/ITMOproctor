var express = require('express');
var router = express.Router();
var moment = require('moment');
var dao = require('../db/dao');
// List all events
router.get('/', function(req, res) {
    var args = {
        examId: req.user.examId
    };
    dao.protocol.list(args, function(err, data) {
        if(!err && data) {
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
// Create new event
router.get('/:userId', function(req, res) {
    var args = {
        userId: req.params.userId,
        examId: req.query.examId,
        text: req.query.text
    };
    dao.protocol.add(args, function(err, data) {
        if(!err && data) {
            req.notify('protocol');
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
module.exports = router;