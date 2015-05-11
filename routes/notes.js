var express = require('express');
var router = express.Router();
var moment = require('moment');
var dao = require('../db/dao');
// List all notes
router.get('/', function(req, res) {
    var args = {
        examId: req.user.examId
    };
    dao.notes.list(args, function(err, data) {
        res.json(data);
    });
});
// Create new note
router.post('/', function(req, res) {
    var args = {
        author: req.user._id,
        examId: req.user.examId,
        text: req.body.text
    };
    dao.notes.add(args, function(err, data) {
        req.notify('notes');
        res.json(data);
    });
});
// Update note
router.put('/:noteId', function(req, res) {
    var args = {
        _id: req.params.noteId,
        author: req.user._id,
        examId: req.user.examId,
        text: req.body.text
    };
    dao.notes.update(args, function(err, data) {
        req.notify('notes');
        res.json(data);
    });
});
// Delete note
router.delete('/:noteId', function(req, res) {
    var args = {
        _id: req.params.noteId,
        author: req.user._id,
        examId: req.user.examId
    };
    dao.notes.delete(args, function(err, data) {
        req.notify('notes');
        res.json(data);
    });
});
module.exports = router;