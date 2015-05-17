var config = require('nconf').file('./config.json');
var mongoose = require('mongoose');
var config = require('nconf');
mongoose.connect(config.get('mongoose:uri'));
var conn = mongoose.connection;
conn.on('error', function(err) {
    console.error("MongoDB connection error:", err.message);
});
conn.once('open', function() {
    console.info("MongoDB is connected.");
    DatabaseGenerator.generator();
});
var Schema = mongoose.Schema;
var moment = require('moment');
var User = require('./db/models/user');
var Exam = require('./db/models/exam');
var Subject = require('./db/models/subject');
var Passport = require('./db/models/passport');
var DatabaseGenerator = {
    rowAmount: 100,
    randomizeNumber: function(min, max) {
        num = Math.ceil((Math.random() * (max - min)) + min);
        return num;
    },
    randomizeString: function(size) {
        var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var str = "";
        for(var i = 0; i < size; i++) {
            str += alphabet.charAt(this.randomizeNumber(0, alphabet.length));
        }
        return str;
    },
    transliterateString: function(str) {
        var res = str.toLowerCase();
        res = res.replace(/а/g, "a");
        res = res.replace(/б/g, "b");
        res = res.replace(/в/g, "v");
        res = res.replace(/г/g, "g");
        res = res.replace(/д/g, "d");
        res = res.replace(/е/g, "e");
        res = res.replace(/ё/g, "yo");
        res = res.replace(/ж/g, "zh");
        res = res.replace(/з/g, "z");
        res = res.replace(/и/g, "i");
        res = res.replace(/й/g, "y");
        res = res.replace(/к/g, "k");
        res = res.replace(/л/g, "l");
        res = res.replace(/м/g, "m");
        res = res.replace(/н/g, "n");
        res = res.replace(/о/g, "o");
        res = res.replace(/п/g, "p");
        res = res.replace(/р/g, "r");
        res = res.replace(/с/g, "s");
        res = res.replace(/т/g, "t");
        res = res.replace(/у/g, "u");
        res = res.replace(/ф/g, "f");
        res = res.replace(/х/g, "h");
        res = res.replace(/ц/g, "ts");
        res = res.replace(/ч/g, "ch");
        res = res.replace(/ш/g, "sh");
        res = res.replace(/щ/g, "sch");
        res = res.replace(/ы/g, "eu");
        res = res.replace(/ь/g, "’");
        res = res.replace(/э/g, "e");
        res = res.replace(/ю/g, "yu");
        res = res.replace(/я/g, "ya");
        return res;
    },
    randomizeUserRoles: function() {
        var proportions = [0.1, 0.6, 0.1, 0.1]; // proportions for user roles 0-3
        var amountEach = [];
        var countEach = [0, 0, 0, 0];
        var userRoles = [];
        var countAmount = 0;
        for(var i = 0; i < proportions.length; i++) { // set amount for each of the roles
            amountEach[i] = Math.floor(proportions[i] * this.rowAmount);
            countAmount += amountEach[i];
        }
        if(countAmount < this.rowAmount) { // if all amount < rowAmount -> add guests
            while(countAmount != this.rowAmount) {
                amountEach[0]++;
                countAmount++;
            }
        }
        for(var i = 0; i < this.rowAmount; i++) { // randomize roles
            var temp = this.randomizeNumber(-0.5, 3);
            countEach[temp]++;
            while(countEach[temp] > amountEach[temp]) {
                countEach[temp]--;
                temp = this.randomizeNumber(-0.5, 3);
                countEach[temp]++;
            }
            userRoles.push(temp);
        }
        return userRoles;
    },
    generateUsers: function() {
        // names for random
        var lastnames = ["Смирнов", "Иванов", "Кузнецов", "Соколов", "Попов", "Лебедев", "Козлов", "Новиков", "Морозов", "Петров", "Волков", "Соловьёв", "Васильев", "Зайцев", "Павлов", "Семёнов", "Голубев", "Виноградов", "Богданов", "Воробьёв", "Фёдоров", "Михайлов", "Беляев", "Тарасов", "Белов", "Комаров", "Орлов", "Киселёв", "Макаров", "Андреев", "Ковалёв", "Медведев", "Ершов", "Никитин", "Соболев", "Рябов", "Поляков", "Цветков", "Данилов", "Жуков", "Фролов", "Журавлёв", "Николаев", "Крылов", "Максимов", "Сидоров", "Осипов", "Белоусов", "Федотов", "Дорофеев", "Егоров", "Матвеев", "Бобров", "Дмитриев", "Калинин", "Анисимов", "Петухов", "Антонов", "Тимофеев", "Никифоров", "Веселов", "Филиппов", "Марков", "Большаков", "Суханов", "Миронов", "Ширяев", "Александров", "Коновалов", "Шестаков", "Казаков", "Ефимов", "Денисов", "Громов", "Фомин", "Давыдов", "Мельников", "Щербаков", "Блинов", "Колесников"];
        var firstnames = ["Александр", "Алексей", "Анатолий", "Андрей", "Антон", "Вадим", "Валентин", "Валерий", "Максим", "Михаил"];
        var midnames = ["Ааронович", "Абрамович", "Августович", "Авдеевич", "Аверьянович", "Адамович", "Адрианович", "Аксёнович", "Александрович", "Алексеевич", "Анатольевич", "Андреевич", "Вадимович", "Валентинович", "Валерианович", "Валерьевич", "Геннадьевич", "Георгиевич", "Давидович", "Давыдович", "Даниилович", "Михайлович", "Петрович", "Семёнович"];
        // define user roles
        var userRoles = this.randomizeUserRoles();
        for(var i = 0; i < this.rowAmount; i++) {
            //user     
            var lname = lastnames[this.randomizeNumber(-0.5, lastnames.length - 1)];
            var randomUser = {
                username: this.transliterateString(lname) + i,
                password: "demo", // not hashed
                salt: 'secret',
                firstname: firstnames[this.randomizeNumber(-0.5, firstnames.length - 1)],
                lastname: lname,
                middlename: midnames[this.randomizeNumber(-0.5, midnames.length - 1)],
                email: this.transliterateString(lname) + '@example.com',
                birthday: moment(this.randomizeNumber(1, 28) + '.' + this.randomizeNumber(0.7, 12) + '.' + this.randomizeNumber(1980, 1990), 'DD.MM.YYYY'),
                role: userRoles[i],
                photo: [{
                    fileId: '55587f1e9bb1ff0c0b721280',
                    filename: 'photo.png'
                }]
            };
            var user = new User(randomUser);
            user.save(function(err, data) {
                if(err) console.log(err);
                else {
                    console.log("user: " + data.username + " " + data._id);
                    var passport = new Passport({
                        userId: data._id,
                        lastname: data.lastname,
                        firstname: data.firstname,
                        middlename: data.middlename,
                        gender: "Мужской",
                        birthday: data.birthday,
                        citizenship: "РФ",
                        birthplace: "Москва",
                        series: "1234",
                        number: "123456",
                        department: "ОВД какого-то района",
                        issuedate: moment("02.03.2010", "DD.MM.YYYY"),
                        departmentcode: "123-456-789",
                        registration: "Город, Улица, Дом, Квартира",
                        description: "-",
                        attach: [{
                            fileId: '55587f1e9bb1ff0c0b721280',
                            filename: 'scan1.png'
                        }, {
                            fileId: '55587f1e9bb1ff0c0b721280',
                            filename: 'scan2.png'
                        }]
                    });
                    passport.save(function(err, data) {
                        if(err) console.log(err);
                    });
                }
            });
        }
    },
    subjectsGenerated: [], // save subjects id's
    subjectsAmountForEachStudent: 3,
    generateSubjects: function() {
        var self = this;
        var titles = ["Иностранный язык", "Философия", "Специальность"];
        var specialities = ["Системный анализ, управление и обработка информации (технические системы)", "Элементы и устройства вычислительной техники и систем управления", "Автоматизация и управление технологическими процессами и производствами (по отраслям)", "Теоретическая механика", "Экономика и управление народным хозяйством", "Логика", "Отечественная история", "Методы и системы защиты информации, информационная безопасность", "Математическое моделирование, численные методы и комплексы программ", "Теоретические основы информатики", "Вычислительные машины, комплексы и компьютерные сети"];
        var codes = ["05.13.01", "05.13.05", "05.13.06", "01.02.01", "08.00.05", "09.00.07", "07.00.02", "05.13.19", "05.13.18", "05.13.17", "05.13.15"];
        var subjects = [];
        for(var i = 0; i < specialities.length; i++) {
            var sp = specialities[i];
            var code = codes[i];
            for(var j = 0; j < titles.length; j++) {
                var subject = {
                    title: titles[j],
                    speciality: sp,
                    code: code
                };
                subjects.push(subject);
            }
        }
        var sCount = -1;
        var sTemp = [];
        for(var i = 0; i < subjects.length; i++) {
            var subj = new Subject(subjects[i]);
            // save id to array
            if(sCount < 2) {
                sCount++;
            } else {
                sCount = 0;
                self.subjectsGenerated.push(sTemp);
                sTemp = [];
            }
            sTemp.push(subj._id);
            //
            subj.save(function(err, data) {
                if(err) console.error(err);
                else {
                    console.info("subject: " + data._id);
                }
            });
        }
    },
    setCurators: function(users) {
        var curators = [];
        var examCurators = [];
        var amount = this.randomizeNumber(0.8, 5);
        var count = 0;
        var i = 0;
        while(i != users.length) {
            if(users[i].role === 2 || users[i].role === 3) {
                curators.push(users[i]._id);
            }
            i++;
        }
        while(count < amount) {
            ind = this.randomizeNumber(-0.7, curators.length - 1);
            examCurators.push(curators[ind]);
            count++;
        }
        return examCurators;
    },
    randomizeExamStatus: function(studentsAmount, amount) {
        // 0 - ожидает, 1 - идет, 2 - сдан, 3 - прерван, 4 - пропущен, 5 - запланирован
        var proportions = [0.16, 0.16, 0.16, 0.16, 0.16, 0.16]; // proportions for exam status        
        var amountEach = [];
        var countEach = [0, 0, 0, 0, 0, 0];
        var examStatus = [];
        var countAmount = 0;
        for(var i = 0; i < proportions.length; i++) { // set amount for each of the roles
            amountEach[i] = Math.floor(proportions[i] * studentsAmount * this.subjectsAmountForEachStudent);
            countAmount += amountEach[i];
        }
        if(countAmount < studentsAmount * this.subjectsAmountForEachStudent) { // if all amount < rowAmount*3 -> add status_0
            while(countAmount != studentsAmount * this.subjectsAmountForEachStudent) {
                amountEach[0]++;
                countAmount++;
            }
        }
        for(var i = 0; i < studentsAmount * this.subjectsAmountForEachStudent; i++) { // randomize roles
            var temp = this.randomizeNumber(-0.5, 5);
            countEach[temp]++;
            while(countEach[temp] > amountEach[temp]) {
                countEach[temp]--;
                temp = this.randomizeNumber(-0.5, 5);
                countEach[temp]++;
            }
            examStatus.push(temp);
        }
        return examStatus;
    },
    generateExams: function() {
        var self = this;
        var examFirstIdRandom = this.randomizeNumber(100000, 300000);
        var checkDay = function(day) {
            if(day > 28 || day < 1) {
                if(day > 28) return 28;
                else return 1;
            } else return day;
        }
        var checkMonth = function(month) {
            if(month > 12 || month < 1) {
                if(month > 12) return 12;
                else return 1;
            } else return month;
        }
        // generate       
        User.find(function(err, users) {
            // count students
            var students = [];
            users.forEach(function(element, index, array) {
                if(element.role === 1) {
                    students.push(element._id);
                }
            });
            // set exams
            var examStatus = self.randomizeExamStatus(students.length, students.length * this.subjectsAmountForEachStudent);
            var examCounter = 0;
            students.forEach(function(element, index, array) {
                var uId = element;
                var exams = self.subjectsGenerated[self.randomizeNumber(0, self.subjectsGenerated.length - 1)];
                //iterate over exams for sudents (max = subjectsAmountForEachStudent)
                exams.forEach(function(element, index, array) {
                    var eBeginDate, eEndDate, eResolution, eStartDate, eStopDate, eCurator;
                    var eSubject = element;
                    var eStatus = examStatus[examCounter];
                    // set exam parameters based on status
                    var now = moment();
                    switch(eStatus) {
                        case 0: //ожидает
                            var startHour = now.hour() - self.randomizeNumber(0.1, 2);
                            startHour = startHour < 0 ? 0 : startHour;
                            var endHour = (startHour + 3);
                            var edate;
                            // check for end date on going beyond the date normal values
                            if(endHour > 23) {
                                endHour = endHour - 24;
                                if((now.date() + 1) > now.daysInMonth()) {
                                    if(now.month() + 2 > 12) {
                                        edate = '1.1.' + (now.year() + 1);
                                    } else {
                                        edate = '1.' + (now.month() + 2) + '.' + now.year();
                                    }
                                } else {
                                    edate = (now.date() + 1) + '.' + checkMonth(now.month() + 1) + '.' + now.year();
                                }
                            } else {
                                edate = now.date() + '.' + checkMonth(now.month() + 1) + '.' + now.year();
                            }
                            // end check
                            var bdate = now.date() + '.' + checkMonth(now.month() + 1) + '.' + now.year();
                            eBeginDate = moment(bdate + ' ' + startHour + ':00', 'DD.MM.YYYY HH:mm');
                            eEndDate = moment(edate + ' ' + endHour + ':00', 'DD.MM.YYYY HH:mm');
                            eResolution = null;
                            eStartDate = moment(self.randomizeNumber(eBeginDate.valueOf(), now.valueOf()));
                            eStopDate = null;
                            eCurator = [];
                            break;
                        case 1: //идет
                            var startHour = now.hour() - self.randomizeNumber(0.1, 2);
                            startHour = startHour < 0 ? 0 : startHour;
                            var endHour = (startHour + 3);
                            var edate;
                            // check for end date on going beyond the date normal values
                            if(endHour > 23) {
                                endHour = endHour - 24;
                                if((now.date() + 1) > now.daysInMonth()) {
                                    if(now.month() + 2 > 12) {
                                        edate = '1.1.' + (now.year() + 1);
                                    } else {
                                        edate = '1.' + (now.month() + 2) + '.' + now.year();
                                    }
                                } else {
                                    edate = (now.date() + 1) + '.' + checkMonth(now.month() + 1) + '.' + now.year();
                                }
                            } else {
                                edate = now.date() + '.' + checkMonth(now.month() + 1) + '.' + now.year();
                            }
                            // end check
                            var bdate = now.date() + '.' + checkMonth(now.month() + 1) + '.' + now.year();
                            eBeginDate = moment(bdate + ' ' + startHour + ':00', 'DD.MM.YYYY HH:mm');
                            eEndDate = moment(edate + ' ' + endHour + ':00', 'DD.MM.YYYY HH:mm');
                            eResolution = null;
                            eStartDate = moment(self.randomizeNumber(eBeginDate.valueOf(), now.valueOf()));
                            eStopDate = null;
                            eCurator = self.setCurators(users);
                            break;
                        case 2: //сдан
                            var date = checkDay(self.randomizeNumber(1, 28)) + '.' + checkMonth(now.month() + 1 - self.randomizeNumber(1, 5)) + '.' + now.year();
                            var startHour = self.randomizeNumber(6, 13);
                            eBeginDate = moment(date + ' ' + startHour + ':00', 'DD.MM.YYYY HH:mm');
                            eEndDate = moment(date + ' ' + (startHour + 3) + ':00', 'DD.MM.YYYY HH:mm');
                            eResolution = true;
                            eStartDate = moment(self.randomizeNumber(eBeginDate.valueOf(), eBeginDate.valueOf() + 1800000));
                            eStopDate = moment(self.randomizeNumber(eStartDate.valueOf() + 3600000, eEndDate.valueOf()));
                            eCurator = self.setCurators(users);
                            break;
                        case 3: //прерван
                            var date = checkDay(self.randomizeNumber(1, 28)) + '.' + checkMonth(now.month() + 1 - self.randomizeNumber(1, 5)) + '.' + now.year();
                            var startHour = self.randomizeNumber(6, 13);
                            eBeginDate = moment(date + ' ' + startHour + ':00', 'DD.MM.YYYY HH:mm');
                            eEndDate = moment(date + ' ' + (startHour + 3) + ':00', 'DD.MM.YYYY HH:mm');
                            eResolution = false;
                            eStartDate = moment(self.randomizeNumber(eBeginDate.valueOf(), eBeginDate.valueOf() + 1800000));
                            eStopDate = moment(self.randomizeNumber(eStartDate.valueOf() + 3600000, eEndDate.valueOf()));
                            eCurator = self.setCurators(users);
                            break;
                        case 4: //пропущен
                            var date = checkDay(now.date() - self.randomizeNumber(1, 10)) + '.' + checkMonth(now.month() + 1 - self.randomizeNumber(-0.1, 5)) + '.' + now.year();
                            var startHour = self.randomizeNumber(6, 13);
                            eBeginDate = moment(date + ' ' + startHour + ':00', 'DD.MM.YYYY HH:mm');
                            eEndDate = moment(date + ' ' + (startHour + 3) + ':00', 'DD.MM.YYYY HH:mm');
                            eResolution = null;
                            eStartDate = null;
                            eStopDate = null;
                            eCurator = [];
                            break;
                        case 5: //запланирован
                            var startHour = self.randomizeNumber(6, 13);
                            var endHour = (startHour + 3);
                            var date = checkDay(self.randomizeNumber(1, 28)) + '.' + checkMonth(now.month() + 1 + self.randomizeNumber(0.7, 5)) + '.' + now.year();
                            eBeginDate = moment(date + ' ' + startHour + ':00', 'DD.MM.YYYY HH:mm');
                            eEndDate = moment(date + ' ' + endHour + ':00', 'DD.MM.YYYY HH:mm');
                            eResolution = null;
                            eStartDate = null;
                            eStopDate = null;
                            eCurator = [];
                            break;
                    }
                    // save exam
                    var userExam = {
                        examId: examFirstIdRandom,
                        subject: eSubject,
                        student: uId,
                        curator: eCurator,
                        resolution: eResolution,
                        beginDate: eBeginDate,
                        endDate: eEndDate,
                        startDate: eStartDate,
                        stopDate: eStopDate,
                        comment: 'exam'
                    };
                    // save exam
                    var exam = new Exam(userExam);
                    exam.save(function(err, data) {
                        if(err) console.error(err);
                        else console.info("exam: " + data._id);
                    });
                    examCounter++;
                    examFirstIdRandom++;
                });
            });
        });
    },
    generator: function() {
        // saving demo-user
        var userArr = [{
            username: 'demo',
            password: 'demo',
            salt: 'secret',
            firstname: 'Демо',
            lastname: 'Демов',
            middlename: 'Демович',
            email: 'demo@example.com',
            birthday: moment('12.03.1982', 'DD.MM.YYYY'),
            role: 2 // Инспектор
        }];
        User.remove({}, function(err) {
            userArr.forEach(function(item) {
                var user = new User(item);
                user.save(function(err, data) {
                    if(err) console.error(err);
                    else console.log("user: " + data.username + " " + data._id);
                });
            });
            Passport.remove({}, function(err) {
                DatabaseGenerator.generateUsers();
            });
        });
        setTimeout(function() {
            Subject.remove({}, function(err) {
                DatabaseGenerator.generateSubjects();
            })
        }, 1000);
        setTimeout(function() {
            Exam.remove({}, function(err) {
                DatabaseGenerator.generateExams();
            })
        }, 2000);
    }
};
//
// Disconnect
//
setTimeout(function() {
    mongoose.disconnect();
}, 10000);