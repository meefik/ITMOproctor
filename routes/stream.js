var express = require('express');
var router = express.Router();
var config = require('nconf');
var request = require('request');
var url = require('url');
// Video stream
router.get('/:examId/:userId/:fileId', function(req, res, next) {
    var uri = url.resolve(config.get("storage:uri"),
        req.params.examId + '/' +
        req.params.userId + '/' +
        req.params.fileId);
    request.get(uri, {
            'timeout': config.get("storage:timeout"),
            //'headers': req.headers,
            'headers': {
                'Range': req.headers['range']
            },
            'auth': {
                'user': config.get("storage:username"),
                'pass': config.get("storage:password"),
                'sendImmediately': false
            }
        }).on('error', function(err) {
            res.status(404).end();
        })
        .on('response', function(response) {
            //res.set(response.headers);
            res.set({
                'Content-Type': 'video/webm',
                'Content-Length': response.headers['content-length'],
                'Accept-Ranges': response.headers['accept-ranges'],
                'Content-Range': response.headers['content-range']
            });
            res.status(response.statusCode);
            response.pipe(res);
        });
});
module.exports = router;