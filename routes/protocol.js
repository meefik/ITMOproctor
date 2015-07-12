var express = require('express');
var router = express.Router();
var moment = require('moment');
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
// Create new event
router.post('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        text: req.body.text
    };
    db.protocol.add(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('protocol-' + args.examId);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;