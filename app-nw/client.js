var gui = require('nw.gui');
gui.Screen.Init();
var win = gui.Window.get();

function parseArgs(argv){
    var args = {};
    for (var index = 0; index < argv.length; index++) {
        var re = new RegExp('--([A-Za-z0-9_]+)=(.*)'),
            matches = re.exec(argv[index]);
        if(matches !== null) {
            args[matches[1]] = matches[2];
        }
    }
    return args;
}

window.addEventListener("message", function(event) {
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
            }
            var message = {
                id: 'version',
                data: version
            };
            event.source.postMessage(message, '*');
            break;
    }
});

var frame = document.getElementById('app-frame');
frame.onload = function() {
    win.title = this.contentDocument.title;
}
var args = parseArgs(gui.App.argv);
var homepage = args['homepage'];
if (!homepage) {
    homepage = gui.App.manifest.homepage;
}
frame.src = homepage;
