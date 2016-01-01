var express = require('express');
var router = express.Router();
var logger = require('../common/logger');
var config = require('nconf');
var db = require('../db');
/**
 * Get list of exams from provider
 * @param req.user
 */
router.fetchExams = function(req, res, next) {
    switch (req.user.provider) {
        case 'local':
            var path = require('path');
            var template = config.get('api:local:template');
            try {
                var data = require(path.join('..', template));
            }
            catch (err) {
                logger.warn(err);
                return next();
            }
            var users = data.users || [];
            users = data.users.length ? users : [req.user.username];
            if (users.indexOf(req.user.username) > -1) {
                var exams = data.exams || [];
                if (!exams.length) return next();
                var args = {
                    userId: req.user._id,
                    exams: exams
                };
                db.exam.add(args, function() {
                    next();
                });
            }
            else return next();
            break;
        case 'openedu':
            // Request proctored exams from edX
            var url = config.get('api:openedu:requestExams').replace('{username}', req.user.username);
            var apiKey = config.get('api:openedu:apiKey');
            var request = require('request');
            logger.debug('API request: ' + url);
            request.get({
                url: url,
                headers: {
                    'X-Edx-Api-Key': apiKey
                }
            }, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    try {
                        var json = JSON.parse(body);
                    }
                    catch (err) {
                        logger.warn("Incorrect JSON format.");
                        return next();
                    }
                    //console.log(json);
                    var arr = [];
                    for (var k in json) {
                        var exams = json[k].exams || [];
                        for (var i = 0, li = exams.length; i < li; i++) {
                            if (exams[i].is_active && exams[i].is_proctored) {
                                arr.push({
                                    examId: exams[i].id,
                                    leftDate: json[k].start,
                                    rightDate: json[k].end,
                                    subject: json[k].name + ' (' + exams[i].exam_name + ')',
                                    duration: exams[i].time_limit_mins
                                });
                            }
                        }
                    }
                    var args = {
                        userId: req.user._id,
                        exams: arr
                    };
                    if (!arr.length) return next();
                    db.exam.add(args, function() {
                        next();
                    });
                }
                else {
                    logger.warn("API response: %s", response.statusCode);
                    next();
                }
            });
            break;
        default:
            next();
    }
};
/**
 * Start exam request to provider
 * @param req.params.examId
 */
router.startExam = function(req, res, next) {
    var args = {
        examId: req.params.examId
    };
    db.exam.info(args, function(err, exam) {
        if (err || !exam) return res.status(400).end();
        var verified = exam.verified || {};
        if (!verified.submit) return next();
        var student = exam.student || {};
        switch (student.provider) {
            case 'openedu':
                var url = config.get('api:openedu:startExam').replace('{examCode}', exam.examCode);
                var apiKey = config.get('api:openedu:apiKey');
                var request = require('request');
                logger.debug('API request: ' + url);
                request.get({
                    url: url,
                    headers: {
                        'X-Edx-Api-Key': apiKey
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        next();
                    }
                    else {
                        logger.warn("API response: %s", response.statusCode);
                        res.status(400).end();
                    }
                });
                break;
            default:
                next();
        }
    });
};
/**
 * Stop exam request to provider
 * @param req.params.examId
 */
router.stopExam = function(req, res, next) {
    var args = {
        examId: req.params.examId
    };
    db.exam.info(args, function(err, exam) {
        if (err || !exam) return res.status(400).end();
        var student = exam.student || {};
        switch (student.provider) {
            case 'openedu':
                var data = {
                    examMetaData: {
                        examCode: exam.examCode,
                        ssiRecordLocator: exam._id,
                        reviewedExam: exam.resolution,
                        reviewerNotes: exam.comment
                    },
                    examApiData: {
                        orgExtra: {
                            examStartDate: exam.startDate,
                            examEndDate: exam.stopDate
                        }
                    },
                    // reviewStatus: 'Clean', 'Rules Violation', 'Not Reviewed', 'Suspicious'
                    reviewStatus: exam.resolution ? 'Clean' : 'Suspicious',
                    videoReviewLink: ''
                };
                var url = config.get('api:openedu:stopExam');
                var apiKey = config.get('api:openedu:apiKey');
                var request = require('request');
                logger.debug('API request: ' + url);
                request.post({
                    url: url,
                    json: data,
                    headers: {
                        'X-Edx-Api-Key': apiKey
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        next();
                    }
                    else {
                        logger.warn("API response: %s", response.statusCode);
                        res.status(400).end();
                    }
                });
                break;
            default:
                next();
        }
    });
};
/**
 * Get exam status from provider
 * @param req.params.examId
 */
router.examStatus = function(req, res, next) {
    var args = {
        examId: req.params.examId
    };
    db.exam.info(args, function(err, exam) {
        if (err || !exam) return res.status(400).end();
        var student = exam.student || {};
        switch (student.provider) {
            case 'openedu':
                var url = config.get('api:openedu:examStatus').replace('{examCode}', exam.examCode);
                var apiKey = config.get('api:openedu:apiKey');
                var request = require('request');
                logger.debug('API request: ' + url);
                request.get({
                    url: url,
                    headers: {
                        'X-Edx-Api-Key': apiKey
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var data = JSON.parse(body);
                        if (data) {
                            req.body.examStatus = data.status;
                        }
                        next();
                    }
                    else {
                        logger.warn("API response: %s", response.statusCode);
                        res.status(400).end();
                    }
                });
                break;
            default:
                next();
        }
    });
};
// Initialize session from edX
router.post('/edx/init', function(req, res) {
    var orgExtra = req.body.orgExtra || {};
    var args = {
        username: orgExtra.username,
        examId: orgExtra.examID,
        examCode: req.body.examCode,
        provider: 'openedu'
    };
    if (!args.username || !args.examId || !args.examCode) {
        return res.status(400).end();
    }
    db.exam.updateCode(args, function(err, data) {
        if (!err && data) {
            res.json({
                sessionId: data._id
            });
        }
        else {
            res.status(400).end();
        }
    });
});
/*
// for tests
router.all('/test', function(req, res) {
    console.log(req.headers);
    console.log(req.body);
    res.json(req.body);
});
*/
module.exports = router;