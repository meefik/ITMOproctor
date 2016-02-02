//
// Login view
//
define([
    "i18n",
    "text!templates/login.html"
], function(i18n, template) {
    console.log('views/login.js');
    var View = Backbone.View.extend({
        events: {
            "click input[type='submit']": "submit"
        },
        initialize: function() {
            this.templates = _.parseTemplate(template);
        },
        destroy: function() {
            this.remove();
        },
        render: function() {
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            this.$Form = this.$("form#auth-plain");
            this.$Username = this.$(".username");
            this.$Password = this.$(".password");
            this.resetForm();
            return this;
        },
        getUsername: function() {
            return this.$Username.textbox('getValue');
        },
        getPassword: function() {
            return this.$Password.textbox('getValue');
        },
        resetForm: function() {
            this.$Form.form("reset");
            this.$Username.next().find("input").focus();
        },
        submit: function(e) {
            e.preventDefault();
            var self = this;
            app.login(this.getUsername(), this.getPassword(),
                function() {
                    self.resetForm();
                });
            return false;
        }
    });
    return View;
});