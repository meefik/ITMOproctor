//
// Router
//
define([], function() {
    console.log('router.js');
    var $body = $('body');
    var $content = $('<div id="content"></div>');
    var Router = Backbone.Router.extend({
        routes: {
            "login": "login",
            "student": "student",
            "student/:examId": "talk",
            "inspector": "inspector",
            "inspector/:examId": "vision",
            "*path": "main"
        },
        render: function(View, options, auth) {
            $.messager.progress('close');
            if (auth || app.isAuth()) {
                if (app.content) {
                    app.content.destroy();
                }
                $body.html($content);
                options = options || {};
                options.el = $('#content');
                app.content = new View(options);
                app.content.render();
            }
            else {
                this.navigate("login", {
                    trigger: true
                });
            }
        },
        main: function() {
            if (app.isAuth()) {
                app.time.syncTime();
                app.connect({
                    'forceNew': true
                });
                var role = app.profile.get("role");
                var navigate = "login";
                switch (role) {
                    case 1:
                        navigate = "student";
                        break;
                    case 2:
                        navigate = "inspector";
                        break;
                    case 3:
                        navigate = "admin";
                        break;
                }
                this.navigate(navigate, {
                    trigger: true
                });
            }
            else {
                this.navigate("login", {
                    trigger: true
                });
            }
        },
        login: function() {
            var self = this;
            require([
                "views/login"
            ], function(View) {
                self.render(View, null, true);
            });
        },
        student: function() {
            var self = this;
            require([
                "views/student"
            ], function(View) {
                self.render(View);
            });
        },
        talk: function(examId) {
            var self = this;
            require([
                "views/talk"
            ], function(View) {
                self.render(View, {
                    examId: examId
                });
            });
        },
        inspector: function() {
            var self = this;
            require([
                "views/inspector"
            ], function(View) {
                self.render(View);
            });
        },
        vision: function(examId) {
            var self = this;
            require([
                "views/vision"
            ], function(View) {
                self.render(View, {
                    examId: examId
                });
            });
        }
    });
    return Router;
});