var express = require('express');
var router = express.Router();
router.get('/workspace', function(req, res) {
    //var examid = req.query.examid;
    //if(examid) req.session.examid = examid;
    //else examid = req.session.examid;
    //if(examid) res.render('workspace');
    //else res.status(404);
    res.render('workspace');
});
router.get('/monitor', function(req, res) {
    res.render('monitor');
});
router.get('/student', function(req, res) {
    res.render('student', {
        photo: '/data/id/photo.png',
        fio: 'Иванов Иван Иванович',
        birthday: '02.03.1994',
        country: 'Россия',
        city: 'Москва'
    });
});
router.get('/exam', function(req, res) {
    res.render('exam', {
        subject: 'Иностранный язык' + req.exam,
        speciality: 'Автоматизация и управление технологическими процессами и производствами',
        code: '05.13.06'
    });
});
module.exports = router;