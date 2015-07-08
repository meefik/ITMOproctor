var gui = require('nw.gui');
gui.Screen.Init();
var win = gui.Window.get();

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
frame.src = gui.App.manifest.homepage;
