var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var urlify = require('urlify').create();
var db = require('../db');
// Upload file
router.post('/', function(req, res, next) {
    var file = req.files[0];
    var extension = file.extension ? '.' + file.extension : '';
    var filename = path.basename(file.originalname, extension);
    file.originalname = urlify(filename) + extension;
    if (!file) return res.status(404).end();
    res.json(file);
});
// Download file
router.get('/:fileId', function(req, res, next) {
    var fileId = req.params.fileId;
    db.storage.download(fileId, function(data) {
        if (!data) return res.status(404).end();
        res.header('Content-Disposition', 'attachment; filename="' + data.filename + '"');
        return res;
    });
});
module.exports = router;