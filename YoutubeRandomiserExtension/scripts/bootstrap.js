
// when a tab/window href changes, show the extension icon
chrome.tabs.onUpdated.addListener(function(id, info, tab){
    if (tab.url.toLowerCase().indexOf("www.youtube.com") > -1){
        chrome.pageAction.show(tab.id);
    }
});

// when the extension is first installed, set the browser storage flag
chrome.runtime.onInstalled.addListener(function(details) {
    chrome.storage.sync.set({run_youtube_randomizer: true});
});

// when the user clicks on the page action, show the popup
chrome.pageAction.onClicked.addListener(function(tab) {
    chrome.pageAction.show(tab.id);
});