/**
 * Модель файлов вложений, которые загружаются во время экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Exam = require('./exam').schema;
var Attach = new Schema({
    _id: false,
    // Идентификатор файла в GridFS
    fileId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    // Оригинальное имя файла
    filename: {
        type: String
    },
    // Описание вложения
    description: {
        type: String
    }
});
module.exports = mongoose.model('Attach', Attach);