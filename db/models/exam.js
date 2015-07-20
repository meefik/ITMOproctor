/**
 * Модель экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user').schema;
var Member = require('./member').schema;
var Exam = new Schema({
    // Название экзамена
    subject: {
        type: String,
        required: true
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
        ref: 'User'
    },
    // Плановое время начала экзамена
    beginDate: {
        type: Date,
        required: true
    },
    // Плановое время окончания экзамена
    endDate: {
        type: Date,
        required: true
    },
    // Фактическое время начала экзамена
    startDate: {
        type: Date
    },
    // Фактическое время окончания экзамена
    stopDate: {
        type: Date
    },
    // Заключение: true - сдан, false - прерван, null - не завершен или не начат
    resolution: {
        type: Boolean
    },
    // Комментарий
    comment: {
        type: String
    }
});
module.exports = mongoose.model('Exam', Exam);