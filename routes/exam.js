var express = require('express');
var router = express.Router();
var db = require('../db');
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
module.exports = router;