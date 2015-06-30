var express = require('express');
var router = express.Router();
var db = require('../db');
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id
    }
    db.vision.start(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('connect-' + args.examId);
        }
        else {
            res.status(400).end();
        }
    });
});
router.put('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        resolution: req.body.resolution,
        comment: req.body.comment
    }
    db.vision.finish(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;