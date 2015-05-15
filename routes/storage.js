var express = require('express');
var router = express.Router();
var fs = require('fs');
var db = require('../db');
// File upload
router.post('/', function(req, res, next) {
    var file = req.files[0];
    if(!file) return res.status(404).end();
    var path = './uploads/' + file.name;
    var writestream = db.gfs.createWriteStream({
        filename: file.originalname
    });
    fs.createReadStream(path).pipe(writestream);
    writestream.on('close', function(data) {
        res.json(data);
        fs.unlink(path);
    });
});
// File download
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
module.exports = router;