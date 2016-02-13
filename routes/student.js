var express = require('express');
var router = express.Router();
var db = require('../db');
var members = require('./members');
var api = require('./api');
var config = require('nconf');
// Get list of exams
router.get('/exam', api.fetchExams, function(req, res) {
    var args = {
        userId: req.user._id,
        history: req.query.history === 'true'
    };
    db.exam.list(args, function(err, data) {
        if (!err && data) {
            res.json({
                "offset": config.get('schedule:offset'),
                "total": data.length,
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
// Start exam
router.get('/exam/:examId', members.updateMember, function(req, res, next) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id
    };
    db.exam.start(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('exam', data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Planing exam by id
router.put('/exam/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        beginDate: req.body.beginDate
    };
    if (!args.beginDate) {
        return res.status(400).end();
    }
    db.exam.plan(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Cancel exam by id
router.delete('/exam/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id
    };
    db.exam.cancel(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Get free dates for planning
router.get('/schedule', function(req, res) {
    var args = {
        leftDate: req.query.leftDate,
        rightDate: req.query.rightDate,
        duration: req.query.duration
    };
    if (!args.leftDate || !args.rightDate || !args.duration) {
        return res.status(400).end();
    }
    db.exam.schedule(args, function(err, data) {
        if (!err && data) {
            res.json(data.dates);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;