var express = require('express');
var router = express.Router();
var db = require('../db');
// List members
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    };
    db.members.list(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;