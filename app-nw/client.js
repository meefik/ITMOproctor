function parseArgs(argv) {
    var args = {};
    for (var index = 0; index < argv.length; index++) {
        var re = new RegExp('--([A-Za-z0-9_]+)=(.*)'),
            matches = re.exec(argv[index]);
        if (matches !== null) {
            args[matches[1]] = matches[2];
        }
    }
    return args;
}

function eventHandler(event) {
    switch (event.data) {
        case 'chooseSourceId':
            gui.Screen.chooseDesktopMedia(["screen"], function(sourceId) {
                var message = {
                    id: 'sourceId',
                    data: sourceId
                };
                event.source.postMessage(message, '*');
            });
            break;
        case 'takeScreenshot':
            win.capturePage(function(img) {
                var message = {
                    id: 'screenshot',
                    data: img
                };
                event.source.postMessage(message, '*');
            }, {
                format: 'png',
                datatype: 'datauri'
            });
            break;
        case 'getVersion':
            var version = {
                app: gui.App.manifest.version,
                nw: process.versions['node-webkit']
            };
            var message = {
                id: 'version',
                data: version
            };
            event.source.postMessage(message, '*');
            break;
        case 'clearCookies':
            win.cookies.getAll({}, function(cookies) {
                cookies.forEach(function(cookie) {
                    // for http
                    win.cookies.remove({
                        url: 'http://' + cookie.domain + cookie.path,
                        name: cookie.name
                    });
                    // for https
                    win.cookies.remove({
                        url: 'https://' + cookie.domain + cookie.path,
                        name: cookie.name
                    });
                });
            });
            break;
        case 'closeWindow':
            win.window.close();
            break;
    }
}

var gui = require('nw.gui');
gui.Screen.Init();
var win = gui.Window.get();

var frame = document.getElementById('app-frame');
frame.onload = function() {
    this.contentWindow.win = win;
    //win.title = this.contentDocument.title;
};
var args = parseArgs(gui.App.argv);
var homepage = args['homepage'];
if (!homepage) {
    homepage = gui.App.manifest.homepage;
}
frame.src = homepage + '#' + win.window.name;

win.window.addEventListener('message', eventHandler);

win.on('new-win-policy', function(frame, url, policy) {
    if (url.indexOf(homepage) > -1) {
        policy.ignore();
        var hash = url.split('#')[1];
        var popup = win.window.open('', hash);
        if (popup.closed || (!popup.document.URL) || (popup.document.URL.indexOf("about") == 0)) {
            popup.location = win.window.location.href;
        }
        else {
            popup.focus();
        }
    }
});