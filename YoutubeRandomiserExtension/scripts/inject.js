
// add scripts to web_accessible_resources in manifest.json

function loadScriptSync(src) {
    var s = document.createElement('script');
    s.src = chrome.extension.getURL(src);
    s.type = "text/javascript";
    s.async = false;
    document.getElementsByTagName('head')[0].appendChild(s);
    s.onload = function() { s.parentNode.removeChild(s); };
}

//loadScriptSync('scripts/jquery-3.1.0.js');
loadScriptSync('scripts/extension.js');