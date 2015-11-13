var config = require('nconf');
var db = require('../db');

var api = {
    fetchExams: function(args, callback) {
        switch (args.accountType) {
            case 'openedu':
                // Request proctored exams from edX
                var url = config.get('api:openedu:requestExams').replace('{username}', args.username);
                var apiKey = config.get('api:openedu:apiKey');
                var request = require('request');
                request.get({
                    url: url,
                    headers: {
                        'X-Edx-Api-Key': apiKey
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var json = JSON.parse(body);
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
                        args.exams = arr;
                        db.exam.add(args, callback);
                    }
                    else {
                        callback();
                    }
                });
                break;
            default:
                callback();
        }
    },
    startExam: function(args, callback) {
        switch (args.accountType) {
            case 'openedu':
                var url = config.get('api:openedu:startExam').replace('{examCode}', args.examCode);
                var apiKey = config.get('api:openedu:apiKey');
                var request = require('request');
                request.get({
                    url: url,
                    headers: {
                        'X-Edx-Api-Key': apiKey
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        callback({
                            ok: 1
                        });
                    }
                    else {
                        callback();
                    }
                });
                break;
            default:
                callback();
        }
    },
    examStatus: function(args, callback) {
        switch (args.accountType) {
            case 'openedu':
                var url = config.get('api:openedu:examStatus').replace('{examCode}', args.examCode);
                var apiKey = config.get('api:openedu:apiKey');
                var request = require('request');
                request.get({
                    url: url,
                    headers: {
                        'X-Edx-Api-Key': apiKey
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        callback(JSON.parse(body));
                    }
                    else {
                        callback();
                    }
                });
                break;
            default:
                callback();
        }
    },
    stopExam: function(args, callback) {
        switch (args.accountType) {
            case 'openedu':
                var url = config.get('api:openedu:stopExam');
                var apiKey = config.get('api:openedu:apiKey');
                var request = require('request');
                var data = {
                    examMetaData: {
                        examCode: args.exam.examCode,
                        ssiRecordLocator: args.exam._id,
                        reviewedExam: args.exam.resolution,
                        reviewerNotes: args.exam.comment
                    }
                };
                request.post({
                    url: url,
                    json: true,
                    body: JSON.stringify(data),
                    headers: {
                        'X-Edx-Api-Key': apiKey
                    }
                }, function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        callback({
                            ok: 1
                        });
                    }
                    else {
                        callback();
                    }
                });
                break;
            default:
                callback();
        }
    }
};

module.exports = api;