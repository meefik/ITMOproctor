var express = require('express');
var router = express.Router();
var db = require('../db');
// List of members
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
// Add or update member
router.updateMember = function(req, res, next) {
    var args = {
        examId: req.params.examId,
        userId: req.user._id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    };
    db.members.update(args, function(err, member) {
        if (err) console.log(err);
        req.notify('members-' + args.examId, {
            userId: args.userId
        });
    });
    next();
};
module.exports = router;