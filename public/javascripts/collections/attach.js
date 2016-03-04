//
// Attach collection
//
define([], function() {
    var Collection = Backbone.Collection.extend({
        url: 'storage',
        initialize: function(models, options, callback) {
            var self = this;
            this.callback = callback || function() {};
            this.model = function(attrs, options) {
                var AttachModel = Backbone.Model.extend({
                    idAttribute: 'id',
                    sync: function(method, model, options) {
                        switch (method) {
                            case 'create':
                                var data = model.toJSON();
                                if (_.isEmpty(data)) {
                                    model.destroy();
                                    self.$Attach = $('<input type="file" name="attach"/>');
                                    self.$Attach.one('change', function() {
                                        self.onChange();
                                    });
                                    self.$Attach.trigger('click');
                                } else {
                                    var json = model.toJSON();
                                    model.destroy();
                                    self.upload(json.file);
                                }
                                break;
                        }
                    }
                });
                return new AttachModel(attrs, options);
            };
        },
        upload: function(file) {
            var self = this;
            this.callback('start', {
                file: file
            });
            var fd = new FormData();
            if (file instanceof File) {
                fd.append('attach', file);
            }
            else {
                fd.append('attach', file.blob, file.name);
            }
            $.ajax({
                type: 'post',
                url: this.url,
                data: fd,
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function(progress) {
                        self.callback('progress', {
                            file: file,
                            progress: progress
                        });
                    };
                    return xhr;
                },
                processData: false,
                contentType: false
            }).done(function(respond) {
                var model = self.add({
                    fileId: respond.fileId,
                    filename: respond.originalname,
                    uploadname: respond.filename
                });
                self.callback('done', {
                    model: model
                });
            }).fail(function() {
                self.callback('fail', {
                    file: file
                });
            });
        },
        onChange: function() {
            var files = this.$Attach.get(0).files;
            this.$Attach.remove();
            if (!files.length) return;
            var file = files[0];
            // check limit
            if (file.size > UPLOAD_LIMIT * 1024 * 1024) {
                return this.callback('limit', {
                    file: file,
                    uploadLimit: UPLOAD_LIMIT
                });
            }
            this.upload(file);
        }
    });
    return Collection;
});