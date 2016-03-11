var express = require('express');
var router = express.Router();
var db = require('../db');
// List all notes
router.get('/:examId', function(req, res) {
    var args = {
        examId: req.params.examId
    };
    db.notes.list(args, function(err, data) {
        if (!err && data) {
            res.json(data);
        }
        else {
            res.status(400).end();
        }
    });
});
// Create new note
router.post('/:examId', function(req, res) {
    var args = {
        userId: req.user._id,
        examId: req.params.examId,
        data: req.body
    };
    db.notes.add(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('notes-' + args.examId, {
                userId: args.userId
            });
        }
        else {
            res.status(400).end();
        }
    });
});
// Update note
router.put('/:examId/:noteId', function(req, res) {
    var args = {
        noteId: req.params.noteId,
        examId: req.params.examId,
        userId: req.user._id,
        data: req.body
    };
    db.notes.update(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('notes-' + args.examId, {
                userId: args.userId
            });
        }
        else {
            res.status(400).end();
        }
    });
});
// Delete note
router.delete('/:examId/:noteId', function(req, res) {
    var args = {
        noteId: req.params.noteId,
        examId: req.params.examId,
        userId: req.user._id
    };
    db.notes.remove(args, function(err, data) {
        if (!err && data) {
            res.json(data);
            req.notify('notes-' + args.examId, {
                userId: args.userId
            });
        }
        else {
            res.status(400).end();
        }
    });
});
module.exports = router;