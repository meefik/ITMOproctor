var express = require('express');
var router = express.Router();
var config = require('nconf');
var db = require('../db');
var multer = require('multer');
var fs = require('fs');
var upload = multer({
    dest: './uploads/',
    limits: {
        fileSize: config.get("upload:limit") * 1024 * 1024, // MB
        files: 1
    },
    onFileSizeLimit: function(file) {
        fs.unlink('./' + file.path); // delete the partially written file
        file.failed = true;
    }
});
// Upload attach
router.post('/', upload.any(), function(req, res, next) {
    var file = req.files[0];
    if (!file) return res.status(400).end();
    res.json(file);
});
// Download attach
router.get('/:fileId', function(req, res, next) {
    var fileId = req.params.fileId;
    db.storage.download(fileId, function(data) {
        if (!data) return res.status(404).end();
        res.header('Content-Disposition', 'attachment; filename="' + data.filename + '"');
        return res;
    });
});
module.exports = router;