/**
 * Модель файлов вложений, которые загружаются во время экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Exam = require('./exam').schema;
var Attach = new Schema({
    // Идентификатор экзамена (связь N:1)
    examId: {
        type: Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    }
    // Идентификатор файла в GridFS
    fileId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    // Описание вложения
    description: {
        type: String
    }
});
module.exports = mongoose.model('Attach', Attach);