/**
 * Модель результатов идентификации
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Exam = require('./exam').schema;
var User = require('./user').schema;
var Attach = require('./attach').schema;
var Verify = new Schema({
    // Дата создания записи
    created: {
        type: Date,
        default: Date.now
    },
    // Студент
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Инспектор
    inspector: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Идентификатор экзамена
    exam: {
        type: Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    // Дата создания записи
    created: {
        type: Date,
        default: Date.now
    },
    // Результат проверки данных
    submit: {
        type: Boolean
    },
    // Контрольная сумма проверенных данных
    hash: {
        type: String
    },
    // Имя
    firstname: {
        type: String
    },
    // Фамилия
    lastname: {
        type: String
    },
    // Отчество
    middlename: {
        type: String
    },
    // Пол
    gender: {
        type: String
    },
    // Дата рождения
    birthday: {
        type: String
    },
    // Гражданство
    citizenship: {
        type: String
    },
    // Тип документа: паспорт, свидетельство о рождении и т.п.
    documentType: {
        type: String
    },
    // Серия и номер документа
    documentNumber: {
        type: String
    },
    // Дата выдачи документа
    documentIssueDate: {
        type: String
    },
    // Адрес
    address: {
        type: String
    },
    // Дополнительная информация
    description: {
        type: String
    },
    // Приложенные файлы (фотография, снимок документа)
    attach: [Attach]
});
module.exports = mongoose.model('Verify', Verify);
