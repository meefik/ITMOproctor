//
// VerifyViewer view
//
define([
  'i18n',
  'text!templates/verify/viewer.html',
  'collections/attach'
], function(i18n, template) {
  console.log('views/verify/viewer.js');
  var View = Backbone.View.extend({
    initialize: function(options) {
      this.options = options || {};
      this.templates = _.parseTemplate(template);
      var Verify = Backbone.Model.extend({
        urlRoot: 'verify'
      });
      this.model = new Verify();
      this.render();
    },
    destroy: function() {
      this.remove();
    },
    render: function() {
      var self = this;
      var tpl = _.template(this.templates['main-tpl']);
      var data = {
        i18n: i18n
      };
      var dataTpl = _.template(self.templates['verify-tpl']);
      var dialog = $(this.el).dialog({
        title: i18n.t('verify.title'),
        width: 'auto',
        height: 'auto',
        closed: true,
        modal: true,
        content: tpl(data),
        buttons: [
          {
            text: i18n.t('verify.closeBtn'),
            iconCls: 'fa fa-times',
            handler: this.doClose.bind(this)
          }
        ],
        onOpen: function() {
          $(this).dialog('center');
          self.model.fetch({
            success: function(model) {
              var html = dataTpl({
                i18n: i18n,
                user: model.toJSON()
              });
              self.$Data.html(html);
              var attach = model.get('attach') || [];
              attach.forEach(function(item) {
                switch (item.filename) {
                case 'photo.png':
                  self.$Photo.attr('src', 'storage/' + item.fileId);
                  break;
                case 'document.png':
                  self.$Document.attr('src', 'storage/' + item.fileId);
                  break;
                }
              });
            }
          });
        }
      });
      this.$Dialog = $(dialog);
      this.$Photo = this.$('.verify-photo');
      this.$Document = this.$('.verify-document');
      this.$Data = this.$('.verify-data');
      return this;
    },
    doOpen: function(verifyId, options) {
      this.options = options;
      this.model.set('_id', verifyId);
      //this.$Data.html('<div style="padding:5px">'+i18n.t('loading')+'</div>');
      this.$Dialog.dialog('open');
    },
    doClose: function() {
      this.$Dialog.dialog('close');
    }
  });
  return View;
});
