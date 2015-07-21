/**
 * Модель файлов вложений, которые загружаются во время экзамена
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
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
    // Время загрузки
    timestamp: {
        type: Date,
        default: Date.now
    },
    // Описание вложения
    description: {
        type: String
    }
});
module.exports = mongoose.model('Attach', Attach);