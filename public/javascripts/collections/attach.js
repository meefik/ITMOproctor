//
// Attach collection
//
define([], function() {
    var Collection = Backbone.Collection.extend({
        url: 'storage',
        initialize: function(models, options) {
            var self = this;
            this.options = options || {};
            this.onStart = this.options.onStart || function() {};
            this.onLimit = this.options.onLimit || function() {};
            this.onProgress = this.options.onProgress || function() {};
            this.onDone = this.options.onDone || function() {};
            this.onFail = this.options.onFail || function() {};
            this.model = function(attrs, options) {
                var AttachModel = Backbone.Model.extend({
                    idAttribute: 'id',
                    sync: function(method, model, options) {
                        switch (method) {
                            case 'create':
                                var data = model.toJSON();
                                if (_.isEmpty(data)) {
                                    model.destroy();
                                    self.$Attach = $('<input type="file" name="attach" style="display:none"/>');
                                    self.$Attach.one('change', function(e) {
                                        var files = e.currentTarget.files;
                                        self.$Attach.remove();
                                        self.selectFile(files);
                                    });
                                    self.$Attach.trigger('click');
                                } else {
                                    var json = model.toJSON();
                                    model.destroy();
                                    self.upload(json.file);
                                }
                                break;
                            case 'delete':
                                model.set('removed', true);
                                break;
                        }
                    }
                });
                return new AttachModel(attrs, options);
            };
        },
        upload: function(file) {
            var self = this;
            this.onStart(file);
            var fd = new FormData();
            fd.append('attach', file);
            $.ajax({
                type: 'post',
                url: this.url,
                data: fd,
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.onprogress = function(progress) {
                        self.onProgress(file, progress);
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
                self.onDone(model);
            }).fail(function() {
                self.onFail(file);
            });
        },
        selectFile: function(files) {
            if (!files.length) return;
            var file = files[0];
            // check limit
            if (file.size > UPLOAD_LIMIT * 1024 * 1024) {
                return this.onLimit(file, UPLOAD_LIMIT);
            }
            this.upload(file);
        }
    });
    return Collection;
});