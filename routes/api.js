var express = require('express');
var router = express.Router();
var db = require('../db');
// Initialize session from edX
router.post('/edx/init', function(req, res) {
    var orgExtra = req.body.orgExtra || {};
    var args = {
        username: orgExtra.username,
        examId: orgExtra.examID,
        examCode: req.body.examCode,
        accountType: 'openedu'
    }
    if (!args.username || !args.examId || !args.examCode) {
        return res.status(400).end();
    }
    db.exam.updateCode(args, function(err, data) {
        if (!err && data) {
            res.json({
                sessionId: data._id
            });
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;