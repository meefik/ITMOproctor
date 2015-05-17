/**
 * Модель паспортных данных
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Attach = require('./attach').schema;
var Passport = new Schema({
    // Идентификатор пользователя (связь 1:1)
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true
    },
    // Серия
    series: {
        type: Number,
        required: true
    },
    // Номер
    number: {
        type: Number,
        required: true
    },
    // Имя
    firstname: {
        type: String,
        required: true
    },
    // Фамилия
    lastname: {
        type: String,
        required: true
    },
    // Отчество
    middlename: {
        type: String,
        required: true
    },
    // Пол
    gender: {
        type: String,
        required: true
    },
    // День рождения
    birthday: {
        type: Date,
        required: true
    },
    // Гражданство
    citizenship: {
        type: String,
        required: true
    },
    // Место рождения
    birthplace: {
        type: String,
        required: true
    },
    // Кем выдан
    department: {
        type: String,
        required: true
    },
    // Дата выдачи
    issuedate: {
        type: Date,
        required: true
    },
    // Код подразделения
    departmentcode: {
        type: String,
        required: true
    },
    // Место регистрации
    registration: {
        type: String,
        required: true
    },
    // Дополнительно
    description: {
        type: String
    },
    // Копии страниц паспорта
    attach: [Attach]
});
module.exports = mongoose.model('Passport', Passport);