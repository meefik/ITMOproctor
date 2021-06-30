var config = require('nconf').file('../config.json');
var mongoose = require('mongoose');
var ObjectID = mongoose.Types.ObjectId;
var fs = require('fs');
var path = require('path');

if (process.argv.length !== 3) {
  console.error('Usage: node import.js <example.json>');
  process.exit(1);
}

var gridFSBucket;
mongoose.connect(config.get('mongoose:uri'), {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});
var conn = mongoose.connection;
conn.on('error', function(err) {
  console.error('MongoDB connection error:', err.message);
});
conn.once('open', function() {
  console.info('MongoDB is connected.');
  var data = require(path.resolve(__dirname, process.argv[2]));
  gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db);
  db.go(data, function() {
    mongoose.disconnect();
    console.log('done');
    process.exit(0);
  });
});

var db = {
  next: function(callback) {
    if (!this.iterator) this.iterator = 0;
    if (arguments.length === 0) this.iterator++;
    else {
      this.iterator--;
      if (this.iterator <= 0) {
        process.stdout.write('\n');
        callback();
      }
    }
    process.stdout.write('.');
  },
  save: function(obj, callback) {
    obj.save(function(err) {
      if (err) console.log(err);
      if (callback) callback();
    });
  },
  upload: function(files, callback) {
    if (files.length === 0) return callback();
    files.forEach(function(file) {
      var fullname = path.join(__dirname, 'files', file.filename);
      fs.exists(fullname, function(exists) {
        if (!exists) {
          if (callback) callback();
          return;
        }
        var fileId = file.fileId;
        if (typeof fileId !== 'object') fileId = new ObjectID(fileId);
        var uploadStream = gridFSBucket.openUploadStreamWithId(
          fileId,
          file.filename,
          {
            contentType: file.mimetype
          }
        );
        uploadStream.once('error', function() {
          if (callback) callback();
        });
        uploadStream.once('finish', function(data) {
          if (callback) callback(data);
        });
        fs.createReadStream(fullname).pipe(uploadStream);
      });
    });
  },
  go: function(data, callback) {
    var self = this;
    var obj, items, k;
    if (data.user) {
      var User = require('./models/user');
      items = data.user;
      for (k in items) {
        obj = new User(items[k]);
        self.next();
        self.save(obj, function() {
          self.next(callback);
        });
        self.next();
        self.upload(items[k].attach, function() {
          self.next(callback);
        });
      }
    }
    if (data.exam) {
      var Exam = require('./models/exam');
      items = data.exam;
      for (k in items) {
        obj = new Exam(items[k]);
        self.next();
        self.save(obj, function() {
          self.next(callback);
        });
      }
    }
  }
};
