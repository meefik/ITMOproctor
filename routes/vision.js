var express = require('express');
var router = express.Router();
var moment = require('moment');
var dao = require('../db/dao');
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id
    }
    dao.vision.start(args, function(err, data) {
        if(!err && data) {
            req.user.examId = data._id;
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
router.put('/:examId', function(req, res) {
    var args = {
        examId: req.user.examId,
        resolution: req.body.resolution,
        comment: req.body.comment
    }
    console.log(args);
    dao.vision.finish(args, function(err, data) {
        if(!err && data) {
            delete req.user.examId;
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
module.exports = router;