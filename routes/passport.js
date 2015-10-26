var express = require('express');
var router = express.Router();
var db = require('../db');
// Get user info
router.get('/:userId', function(req, res) {
    var args = {
        userId: req.params.userId
    }
    db.profile.info(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Update user info
router.put('/:userId', function(req, res) {
    var args = {
        userId: req.params.userId,
        data: {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            middlename: req.body.middlename,
            gender: req.body.gender,
            birthday: req.body.birthday,
            email: req.body.email,
            citizenship: req.body.citizenship,
            documentType: req.body.documentType,
            documentNumber: req.body.documentNumber,
            documentIssueDate: req.body.documentIssueDate,
            description: req.body.description,
            attach: req.body.attach
        }
    };
    db.profile.update(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;