/**
 * Модель экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user').schema;
var Exam = new Schema({
    // Идентификатор экзамена в LMS
    examId: {
        type: String
    },
    // Идентификатор экзаменационной сессии в LMS
    examCode: {
        type: String
    },
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
    // Контрольная сумма проверенных данных студента
    verified: {
        // Результат проверки данных
        submit: {
            type: Boolean
        },
        // Персональные данные студента
        data: {},
        // Контрольная сумма проверенных данных
        hash: {
            type: String
        }
    },
    // Инспектор
    inspector: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // Плановая продолжительность экзамена в минутах
    duration: {
        type: Number,
        required: true
    },
    // Верхняя граница сдачи экзамена
    leftDate: {
        type: Date,
        required: true
    },
    // Нижняя граница сдачи экзамена
    rightDate: {
        type: Date,
        required: true
    },
    // Плановое время начала экзамена
    beginDate: {
        type: Date
    },
    // Плановое время окончания экзамена
    endDate: {
        type: Date
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