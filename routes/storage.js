var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var db = require('../db');
// Upload file
router.post('/', function(req, res, next) {
    var file = req.files[0];
    if(!file) return res.status(404).end();
    var path = path.join('uploads', path.basename(file.name));
    var writestream = db.gfs.createWriteStream({
        filename: file.originalname
    });
    fs.createReadStream(path).pipe(writestream);
    writestream.on('close', function(data) {
        res.json(data);
        fs.unlink(path);
    });
});
// Download file
router.get('/:fileId', function(req, res, next) {
    var fileId = req.params.fileId;
    db.gfs.findOne({
        _id: fileId
    }, function(err, file) {
        if(!err && file) {
            var readstream = db.gfs.createReadStream({
                _id: fileId
            });
            res.header('Content-Disposition', 'attachment; filename="' + file.filename + '"');
            readstream.pipe(res);
        } else {
            return res.status(404).end();
        }
    });
});
/*
// Delete file from uploads directory
router.delete('/:filename', function(req, res, next) {
    var filename = req.params.filename;
    var path = path.join('uploads', path.basename(filename));
    fs.exists(path, function(exists) {
        if(exists) fs.unlink(path);
    });
});
*/
module.exports = router;