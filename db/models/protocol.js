/**
 * Модель протокола экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Exam = require('./exam').schema;
var Protocol = new Schema({
    // Идентификатор экзамена (связь N:1)
    exam: {
        type: Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    // Время события
    time: {
        type: Date,
        default: Date.now
    },
    // Текст события
    text: {
        type: String
    }
});
module.exports = mongoose.model('Protocol', Protocol);