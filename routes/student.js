var express = require('express');
var router = express.Router();
var db = require('../db');
var members = require('./members');
var api = require('./api');
// Get list of exams
router.get('/', api.fetchExams, function(req, res) {
    var args = {
        userId: req.user._id
    };
    db.exam.list(args, function(err, data) {
        if (!err) {
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
    };
    db.exam.info(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Update exam state
router.put('/:examId', function(req, res, next) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id
    };
    db.exam.start(args, function(err, data) {
        if (!err && data) {
            req.exam = data;
            next();
        }
        else {
            res.status(400).end();
        }
    });
}, members.updateMember, function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        exam: req.exam
    };
    res.json(args.exam);
    req.notify('exam-' + req.params.examId, {
        userId: args.userId
    });
});
module.exports = router;