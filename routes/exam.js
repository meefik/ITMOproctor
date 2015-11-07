var express = require('express');
var router = express.Router();
var db = require('../db');
// Get free dates for planning
router.get('/', function(req, res) {
    var args = {
        leftDate: req.query.leftDate,
        rightDate: req.query.rightDate,
        duration: req.query.duration
    }
    db.exam.schedule(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Get exam info by id
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    }
    db.exam.info(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Planing exam by id
router.put('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        beginDate: req.body.beginDate
    }
    db.exam.update(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;