//
// Profile view
//
define(['i18n', 'text!templates/user/viewer.html'], function(i18n, template) {
  console.log('views/user/viewer.js');
  var View = Backbone.View.extend({
    initialize: function() {
      // Templates
      this.templates = _.parseTemplate(template);
      // User model
      var User = Backbone.Model.extend({
        urlRoot: 'user'
      });
      this.model = new User();
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
      this.loadingMsg = tpl(data);
      var dialog = $(this.el).dialog({
        title: i18n.t('user.title'),
        width: 550,
        height: 450,
        closed: true,
        modal: true,
        content: this.loadingMsg,
        buttons: [
          {
            text: i18n.t('user.close'),
            iconCls: 'fa fa-times',
            handler: function() {
              self.doClose();
            }
          }
        ],
        onOpen: function() {
          $(this).dialog('center');
        }
      });
      this.$Dialog = $(dialog);
      this.$Container = this.$Dialog.find('.dialog-container');
      return this;
    },
    doOpen: function(userId) {
      var self = this;
      this.$Container.html(this.loadingMsg);
      var tpl = _.template(this.templates['dialog-tpl']);
      this.model.clear();
      this.model.set('_id', userId);
      this.model.fetch({
        success: function(model) {
          var data = {
            i18n: i18n,
            user: model.toJSON()
          };
          self.$Container.html(tpl(data));
        }
      });
      this.$Dialog.dialog('open');
    },
    doClose: function() {
      this.$Dialog.dialog('close');
    }
  });
  return View;
});
