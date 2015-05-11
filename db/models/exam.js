/**
 * Модель экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Subject = require('./subject').schema;
var User = require('./user').schema;
var Exam = new Schema({
    // Идентификатор экзамена (отображаемый)
    examId: {
        type: Number,
        unique: true,
        required: true
    },
    // Предмет, который сдает студент
    subject: {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
        required: true        
    },
    // Студент
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Список кураторов (первый в списке считается основным)
    // Экзамен считается начатым, если есть хотя бы один куратор
    curator: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
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