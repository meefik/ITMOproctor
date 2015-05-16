var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var db = require('../db');
// Upload file
router.post('/', function(req, res, next) {
    var file = req.files[0];
    if(!file) return res.status(404).end();
    var fullname = path.join('uploads', path.basename(file.name));
    var writestream = db.gfs.createWriteStream({
        filename: file.originalname
    });
    fs.createReadStream(fullname).pipe(writestream);
    writestream.on('close', function(data) {
        res.json(data);
        fs.unlink(fullname);
    });
});
// Download file
router.get('/:fileId', function(req, res, next) {
    var fileId = req.params.fileId;
    db.gfs.findOne({
        _id: fileId
    }, function(err, data) {
        if(!err && data) {
            var readstream = db.gfs.createReadStream({
                _id: fileId
            });
            res.header('Content-Disposition', 'attachment; filename="' + data.filename + '"');
            readstream.pipe(res);
        } else {
            return res.status(404).end();
        }
    });
});
// Delete file
router.delete('/:fileId', function(req, res, next) {
    var fileId = req.params.fileId;
    // ...
});
module.exports = router;