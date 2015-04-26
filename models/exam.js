/**
 * Модель экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user').schema;
var Exam = new Schema({
    // Идентификатор экзамена (отображаемый)
    examId: {
        type: Number,
        unique: true,
        required: true
    },
    // Студент
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Список кураторов
    curator: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    // Статус: 1, 2, 3, 4
    status: {
        type: Number,
        required: true,
        dafault: 1
    },
    // Время начала
    beginDate: {
        type: Date,
        required: true
    },
    // Время окончания
    endDate: {
        type: Date,
        required: true
    },
    // Комментарий
    comment: {
        type: String
    }
});
module.exports = mongoose.model('Exam', Exam);