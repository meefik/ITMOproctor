var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../db');
// List all events
router.get('/', function(req, res) {
    var args = {
        examId: req.user.examId
    };
    db.protocol.list(args, function(err, data) {
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
    db.protocol.add(args, function(err, data) {
        if(!err && data) {
            req.notify('protocol');
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
module.exports = router;