var express = require('express');
var router = express.Router();
var moment = require('moment');
router.get('/', function(req, res) {
    var rows = req.db.notes.get();
    var data = {
        "total": rows.length,
        "rows": rows
    }
    res.json(data);
});
router.post('/', function(req, res) {
    var randomInt = function(low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    }
    var noteId = randomInt(1, 1000);
    var noteTime = new Date();
    res.json({
        noteId: noteId,
        noteTime: noteTime
    });
});
router.put('/:noteId', function(req, res) {
    var noteId = req.params.noteId;
    var noteText = req.body.noteText;
    res.end();
});
router.delete('/:noteId', function(req, res) {
    var noteId = req.params.noteId;
    res.end();
});
module.exports = router;