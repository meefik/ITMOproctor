var express = require('express');
var router = express.Router();
var db = require('../db');
router.get('/', function(req, res) {
    var args = {
        userId: req.user._id
    }
    db.exam.list(args, function(err, data) {
        if (!err && data.length > 0) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    }
    db.vision.start(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;