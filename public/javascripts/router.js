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
            "study": "study",
            "talk/:examId": "talk",
            "monitor": "monitor",
            "vision/:examId": "vision",
            "play/:examId": "play",
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
                var role = app.profile.get("role");
                var navigate = "login";
                switch (role) {
                    case 1:
                        navigate = "study";
                        break;
                    case 2:
                        navigate = "monitor";
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
        study: function() {
            var self = this;
            require([
                "views/study"
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
        monitor: function() {
            var self = this;
            require([
                "views/monitor"
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
        },
        play: function(examId) {
            var self = this;
            require([
                "views/play"
            ], function(View) {
                self.render(View, {
                    examId: examId
                });
            });
        }
    });
    return Router;
});