var moment = require('moment');
var notes = {
    init: function() {
        this.rows = [{
            noteId: 1,
            noteTime: new Date((new Date()).getTime() - 3 * 60000),
            noteText: 'Комментарий 1'
        }, {
            noteId: 2,
            noteTime: new Date((new Date()).getTime() - 2 * 60000),
            noteText: 'Комментарий 2'
        }, {
            noteId: 3,
            noteTime: new Date((new Date()).getTime() - 60000),
            noteText: 'Комментарий 3'
        }, {
            noteId: 4,
            noteTime: new Date(),
            noteText: 'Комментарий 4'
        }];
    },
    get: function() {
        return this.rows;
    }
}
var monitor = {
    init: function() {
        var r = 1000;
        // demo prototype
        var proto = [{
            "id": "189221",
            "student": "Иванов И.И.",
            "exam": "Специальность 05.13.12",
            "date": 1426481205000,
            "duration": 1000000,
            "inspector": "Петров П.П.",
            "status": 1
        }, {
            "id": "189222",
            "student": "Сидоров С.С.",
            "exam": "Специальность 06.13.12",
            "date": 1424491305000,
            "duration": 1500000,
            "inspector": "Петров П.П.",
            "status": 2
        }, {
            "id": "189223",
            "student": "Иванова Р.П.",
            "exam": "Специальность 03.12.12",
            "date": 1429471505000,
            "duration": null,
            "inspector": "Григорьев В.А.",
            "status": 3
        }, {
            "id": "189224",
            "student": "Ефимова Г.Е.",
            "exam": "Специальность 01.10.12",
            "date": 1428161405000,
            "duration": null,
            "inspector": "Григорьев В.А.",
            "status": 4
        }];
        // generate rows
        this.rows = [];
        for(var i = 0; i < r; i++) {
            var k = Math.floor(Math.random() * 4);
            this.rows.push(proto[k]);
        }
    },
    get: function(s, l) {
        return this.rows.slice(s, l);
    }
}
notes.init();
monitor.init();
exports.monitor = monitor;
exports.notes = notes;