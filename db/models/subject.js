/**
 * Модель предмета, который сдает студент
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Subject = new Schema({
    // Название предмета
    title: {
        type: String,
        required: true
    },
    // Направление
    speciality: {
        type: String,
        required: true
    },
    // Код
    code: {
        type: String,
        required: true
    }
});
module.exports = mongoose.model('Subject', Subject);