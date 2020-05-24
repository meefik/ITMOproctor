//
// Play view
//
define([
  'i18n',
  'text!templates/admin/play.html',
  'views/verify/viewer'
], function(i18n, template, VerifyViewer) {
  console.log('views/admin/play.js');
  var View = Backbone.View.extend({
    events: {
      'click .student-link': 'doVerify'
    },
    initialize: function(options) {
      this.examId = options.params.examId;
      // Templates
      this.templates = _.parseTemplate(template);
      // Models
      var Exam = Backbone.Model.extend({
        urlRoot: 'exam'
      });
      this.exam = new Exam({
        _id: this.examId
      });
      var Chat = Backbone.Collection.extend({
        url: 'chat/' + this.examId
      });
      this.chat = new Chat();
      var Notes = Backbone.Collection.extend({
        url: 'notes/' + this.examId
      });
      this.notes = new Notes();
      var Members = Backbone.Collection.extend({
        url: 'members/' + this.examId
      });
      this.members = new Members();
      this.view = {
        verify: new VerifyViewer()
      };
    },
    destroy: function() {
      for (var v in this.view) {
        if (this.view[v]) this.view[v].destroy();
      }
      this.remove();
    },
    render: function() {
      var self = this;
      var tpl = _.template(this.templates['main-tpl']);
      var data = {
        i18n: i18n,
        examId: this.examId
      };
      this.$el.html(tpl(data));
      $.parser.parse(this.$el);
      // jQuery
      this.$Data = this.$('.panel-data');
      this.$Chat = this.$('.panel-chat');
      this.$Notes = this.$('.panel-notes');
      this.$Members = this.$('.panel-members');
      // Resize widgets
      var resizeWidget = function(container, pobj) {
        var p = pobj.panel('panel');
        p.detach()
          .appendTo(container)
          .css({
            position: 'absolute',
            top: 0,
            left: 0
          });
        pobj.panel('resize', {
          width: container.width(),
          height: container.height()
        });
      };
      this.$('.ws-widget').each(function(index, element) {
        var wsWidget = $(element);
        var wsContent = self.$('.ws-content');
        var wsPanel = wsWidget.find('.ws-panel');
        wsPanel.panel({
          onMaximize: function() {
            resizeWidget(wsContent, wsPanel);
          },
          onRestore: function() {
            resizeWidget(wsWidget, wsPanel);
          }
        });
      });
      this.exam.fetch({
        success: function(model) {
          var tpl = _.template(self.templates['data-tpl']);
          var data = {
            i18n: i18n,
            exam: model.toJSON()
          };
          self.$Data.html(tpl(data));
        }
      });
      this.chat.fetch({
        success: function(collection) {
          var tpl = _.template(self.templates['messages-tpl']);
          var data = {
            i18n: i18n,
            messages: collection.toJSON()
          };
          self.$Chat.html(tpl(data));
        }
      });
      this.notes.fetch({
        success: function(collection) {
          var tpl = _.template(self.templates['messages-tpl']);
          var data = {
            i18n: i18n,
            messages: collection.toJSON()
          };
          self.$Notes.html(tpl(data));
        }
      });
      this.members.fetch({
        success: function(collection) {
          var tpl = _.template(self.templates['members-tpl']);
          var data = {
            i18n: i18n,
            members: collection.toJSON()
          };
          self.$Members.html(tpl(data));
        }
      });
      return this;
    },
    doVerify: function() {
      var verified = this.exam.get('verified');
      if (!verified) return;
      this.view.verify.doOpen(verified._id);
    }
  });
  return View;
});
