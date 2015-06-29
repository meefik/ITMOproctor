var express = require('express');
var router = express.Router();
var moment = require('moment');
var db = require('../db');
// List all notes
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    };
    db.notes.list(args, function(err, data) {
        if(!err && data) {
            res.json(data);
        } else {
            res.status(400).end();
        }
    });
});
// Create new note
router.post('/:examId', function(req, res) {
    var args = {
        author: req.user._id,
        examId: req.params.examId,
        text: req.body.text,
        attach: req.body.attach
    };
    db.notes.add(args, function(err, data) {
        if(!err && data) {
            res.json(data);
            req.notify('notes');
        } else {
            res.status(400).end();
        }
    });
});
// Update note
router.put('/:examId/:noteId', function(req, res) {
    var args = {
        _id: req.params.noteId,
        author: req.user._id,
        examId: req.params.examId,
        text: req.body.text
    };
    db.notes.update(args, function(err, data) {
        if(!err && data) {
            res.json(data);
            req.notify('notes');
        } else {
            res.status(400).end();
        }
    });
});
// Delete note
router.delete('/:examId/:noteId', function(req, res) {
    var args = {
        _id: req.params.noteId,
        author: req.user._id,
        examId: req.params.examId
    };
    db.notes.delete(args, function(err, data) {
        if(!err && data) {
            res.json(data);
            req.notify('notes');
        } else {
            res.status(400).end();
        }
    });
});
module.exports = router;