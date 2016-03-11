var express = require('express');
var router = express.Router();
var db = require('../db');
var api = require('./api');
// Get verified data by id
router.get('/:verifyId',
    function(req, res) {
        var args = {
            verifyId: req.params.verifyId
        };
        db.verify.get(args, function(err, data) {
            if (err || !data) return res.status(400).end();
            res.json(data);
        });
    });
// Verify user (passport)
router.post('/',
    function(req, res, next) {
        var args = {
            userId: req.user._id,
            data: req.body
        };
        db.verify.submit(args, function(err, data) {
            if (!err && data) {
                res.locals.examId = args.examId;
                res.json(data);
                next();
            }
            else res.status(400).end();
        });
    },
    api.startExam);

module.exports = router;