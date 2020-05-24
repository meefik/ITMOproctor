//
// Talk view
//
define([
  'i18n',
  'text!templates/talk.html',
  'views/settings',
  'views/exam/viewer',
  'views/passport/viewer',
  'views/members',
  'views/chat',
  'views/webcam',
  'views/screen'
], function(
  i18n,
  template,
  SettingsView,
  ExamViewer,
  PassportViewer,
  MembersView,
  ChatView,
  WebcamView,
  ScreenView
) {
  console.log('views/talk.js');
  var View = Backbone.View.extend({
    bindings: {
      '.exam-subject': {
        observe: 'subject'
      },
      '.server-time': {
        observe: 'time',
        onGet: function(val) {
          return moment(val).format('HH:mm:ss');
        }
      },
      '.duration-time': {
        observe: 'time',
        onGet: function() {
          var out = '0.00:00:00';
          var now = app.now();
          var startDate = this.exam.get('startDate');
          if (startDate) {
            var diff = now.diff(startDate);
            if (diff < 0) diff = 0;
            out = moment(diff)
              .utc()
              .format('HH:mm:ss');
          }
          var endDate = this.exam.get('endDate');
          if (endDate && this.$DurationWidget) {
            if (moment(endDate).diff(now, 'minutes') <= 5)
              this.$DurationWidget.css('color', 'red');
            else if (moment(endDate).diff(now, 'minutes') <= 15)
              this.$DurationWidget.css('color', 'orange');
          }
          return out;
        }
      }
    },
    initialize: function(options) {
      // Variables
      var self = this;
      this.options = options || {};
      // Templates
      this.templates = _.parseTemplate(template);
      // Socket events
      this.connectHandler = function() {
        self.$NetworkWidget.html(i18n.t('talk.online'));
        self.$NetworkWidget.css('color', 'green');
      };
      this.disconnectHandler = function() {
        self.$NetworkWidget.html(i18n.t('talk.offline'));
        self.$NetworkWidget.css('color', 'red');
      };
      app.io.notify.on('connect', this.connectHandler);
      app.io.notify.on('disconnect', this.disconnectHandler);
      // Sub views
      this.view = {
        settings: new SettingsView(),
        passport: new PassportViewer(),
        exam: new ExamViewer(),
        members: new MembersView({
          examId: this.options.examId
        }),
        chat: new ChatView({
          examId: this.options.examId
        }),
        webcam: new WebcamView({
          examId: this.options.examId,
          userId: app.profile.get('_id')
        }),
        screen: new ScreenView({
          examId: this.options.examId,
          userId: app.profile.get('_id'),
          capture: true
        })
      };
      // Exam model
      var Exam = Backbone.Model.extend({
        urlRoot: 'student/exam'
      });
      this.exam = new Exam({
        _id: this.options.examId
      });
      this.listenTo(this.exam, 'sync', this.submitDlg.bind(this));
      // Socket notification
      app.io.notify.on('exam-' + this.options.examId, function(data) {
        if (!app.isMe(data.userId)) {
          self.exam.fetch();
        }
      });
      // Start exam
      this.exam.fetch();
    },
    render: function() {
      var self = this;
      var tpl = _.template(this.templates['main-tpl']);
      var data = {
        i18n: i18n
      };
      this.$el.html(tpl(data));
      $.parser.parse(this.$el);
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
        pobj.find('video').each(function(index, element) {
          if (element.src != '') {
            element.play();
          }
          if (element.className == 'video-input') {
            element.style.left = '';
            element.style.bottom = '';
            element.style.top = '5px';
            element.style.right = '5px';
          }
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
      // jQuery selectors
      this.$Menu = $('#main-menu');
      this.$NetworkWidget = this.$('.network-widget');
      this.$DurationWidget = this.$('.duration-time');
      this.$FinishBtn = this.$('.finish-btn');
      this.view.members.setElement(this.$('.panel-members'));
      this.view.chat.setElement(this.$('.panel-chat'));
      this.view.webcam.setElement(this.$('.panel-webcam'));
      this.view.screen.setElement(this.$('.panel-screen'));
      // Render panels
      this.view.members.render();
      this.view.chat.render();
      this.view.webcam.render();
      this.view.screen.render();
      // DOM events
      this.$Menu.menu({
        onClick: function(item) {
          switch (item.name) {
          case 'exam':
            self.view.exam.doOpen(self.options.examId);
            break;
          case 'passport':
            self.view.passport.doOpen();
            break;
          case 'settings':
            self.view.settings.doOpen();
            break;
          case 'disconnect':
            self.disconnect();
            break;
          }
        }
      });
      this.stickit(app.time);
      this.stickit(this.exam);
      return this;
    },
    destroy: function() {
      for (var v in this.view) {
        if (this.view[v]) this.view[v].destroy();
      }
      app.io.notify.removeListener('exam-' + this.options.examId);
      app.io.notify.removeListener('connect', this.connectHandler);
      app.io.notify.removeListener('disconnect', this.disconnectHandler);
      this.remove();
    },
    submitDlg: function() {
      var resolution = this.exam.get('resolution');
      if (resolution == null) return;
      if (resolution) {
        resolution =
          '<strong style="color:green">' +
          i18n.t('talk.submit.true') +
          '</strong>';
      } else {
        resolution =
          '<strong style="color:red">' +
          i18n.t('talk.submit.false') +
          '</strong>';
      }
      var message =
        i18n.t('talk.submit.message', {
          resolution: resolution
        }) + '.';
      var comment = this.exam.get('comment');
      if (comment) {
        message += '<p>' + comment + '</p>';
      } else {
        message += '<p>' + i18n.t('talk.submit.nocomment') + '.</p>';
      }
      $.messager.alert(
        i18n.t('talk.submit.title'),
        message,
        null,
        this.disconnect.bind(this)
      );
    },
    disconnect: function() {
      app.router.navigate('study', {
        trigger: true
      });
    }
  });
  return View;
});
