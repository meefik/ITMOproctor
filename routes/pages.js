var express = require('express');
var router = express.Router();
router.get('/workspace', function(req, res) {
    res.render('workspace');
});
router.get('/monitor', function(req, res) {
    res.render('monitor');
});
router.get('/chat', function(req, res) {
    res.render('chat');
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
        subject: 'Иностранный язык',
        speciality: 'Автоматизация и управление технологическими процессами и производствами',
        code: '05.13.06'
    });
});
module.exports = router;