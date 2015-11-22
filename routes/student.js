var express = require('express');
var router = express.Router();
var db = require('../db');
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
// Start exam
router.get('/:examId', function(req, res, next) {
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
module.exports = router;