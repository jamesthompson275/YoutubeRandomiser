
// add scripts to web_accessible_resources in manifest.json

var jquery = document.createElement('script'); //type=text/javascript

var extension = document.createElement('script'); //type=text/javascript

jquery.src = chrome.extension.getURL('scripts/jquery-3.1.0.js')
extension.src = chrome.extension.getURL('scripts/extension.js');

(document.head || document.documentElement).appendChild(jquery);

setTimeout(function() {
    (document.head || document.documentElement).appendChild(extension);
}, 100);

s1.onload = function() { s1.parentNode.removeChild(s1); };
s2.onload = function() { s2.parentNode.removeChild(s2); };