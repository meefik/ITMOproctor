/**
 * Модель заметок
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Attach = require('./attach').schema;
var Note = new Schema({
  // Идентификатор экзамена (связь N:1)
  exam: {
    type: Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  // Автор заметки
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Время заметки
  time: {
    type: Date,
    default: Date.now
  },
  // Текст заметки
  text: {
    type: String
  },
  // Возможность редактировать заметку
  editable: {
    type: Boolean,
    default: true
  },
  // Ссылка на вложение
  attach: [Attach]
});
module.exports = mongoose.model('Note', Note);
