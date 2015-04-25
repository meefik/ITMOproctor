var express = require('express');
var router = express.Router();
var moment = require('moment');
router.get('/', function(req, res) {
    var data = {
        student: {
            id: "1",
            fio: "Иванов Иван Иванович",
            birthday: moment('21.04.1987', 'DD.MM.YYYY'),
            country: "Россия",
            city: "Москва",
            photo: "photo.jpg"
        },
        exam: {
            id: "1",
            subject: "Иностранный язык",
            speciality: "Автоматизация и управление технологическими процессами и производствами",
            code: "05.13.06"
        }
    };
    res.json(data);
});
module.exports = router;