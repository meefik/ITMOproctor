/**
 * Модель сообщений
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Exam = require('./exam').schema;
var User = require('./user').schema;
var Attach = require('./attach').schema;
var Chat = new Schema({
  // Идентификатор экзамена (связь N:1)
  exam: {
    type: Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  // Автор сообщения
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Время сообщения
  time: {
    type: Date,
    default: Date.now
  },
  // Текст сообщения
  text: {
    type: String
  },
  // Ссылка на вложение
  attach: [Attach]
});
module.exports = mongoose.model('Chat', Chat);
