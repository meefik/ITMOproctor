//
// Admin view
//
define([
    "i18n",
    "text!templates/admin.html",
    "views/profile-editor"
], function(i18n, template, ProfileEditorView) {
    console.log('views/admin.js');
    var View = Backbone.View.extend({
        bindings: {
            '.server-date': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('DD.MM.YYYY');
                }
            },
            '.server-time': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('HH:mm:ss');
                }
            }
        },
        initialize: function() {
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                profile: new ProfileEditorView()
            };
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            // jQuery selectors
            this.$Menu = $('#main-menu');
            // DOM events
            this.$Menu.menu({
                onClick: function(item) {
                    switch (item.name) {
                        case "profile":
                            self.view.profile.doOpen();
                            break;
                        case "logout":
                            app.logout();
                            break;
                    }
                }
            });
            this.stickit(app.time);
            return this;
        },
        destroy: function() {
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
            this.remove();
        }
    });
    return View;
});
