chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(portOnMessageHanlder);

    function portOnMessageHanlder(message) {
        switch (message) {
            case 'chooseSourceId':
                var session = ['screen'];
                chrome.desktopCapture.chooseDesktopMedia(session, port.sender.tab, function(sourceId) {
                    console.log('sourceId', sourceId);
                    // if "cancel" button is clicked
                    if (!sourceId || !sourceId.length) {
                        return port.postMessage('PermissionDeniedError');
                    }
                    var message = {
                        id: 'sourceId',
                        data: sourceId
                    };
                    port.postMessage(message);
                });
                break;
            case 'takeScreenshot':
                chrome.tabs.captureVisibleTab(null, {
                    format: 'png'
                }, function(dataUrl) {
                    var message = {
                        id: 'screenshot',
                        data: dataUrl
                    };
                    port.postMessage(message);
                });
                break;
            case 'getVersion':
                function getChromeVersion() {
                    var match = window.navigator.userAgent.match(/Chrom(?:e|ium)\/([0-9\.]+)/);
                    return match ? match[1] : null;
                }
                var manifest = chrome.runtime.getManifest();
                var version = {
                    version: manifest.version,
                    engine: 'chrome',
                    release: getChromeVersion()
                };
                var message = {
                    id: 'version',
                    data: version
                };
                port.postMessage(message);
                break;
        }
    }
});
