/// <reference path="../../jquery.d.ts"/>

console.log('script load');

var songs = [];
var api = null;
var description = null;
var playerBar = null;
var watch = false;

function checkNavigation() {

    if ('/watch' === location.pathname) {
        console.log('NAV: watch page!');
        watch = true;
        init();
    }
    else 
    {
        console.log('NAV: non-watch page')
        watch = false;
        destroy();
    }
}

// try to load the player & the video description
// delay 1sec while this fails
function init(attempt = 0){
    if (!watch) {
        console.log('aborting init');
        return;
    }

    var _api = document.getElementById('movie_player');
    //console.log('api', _api, _api.getCurrentTime);
    if (_api.getCurrentTime === undefined) {
        console.log('retry');
        window.setTimeout(init, 1000, attempt++);
        return;
    }

    console.log('player ready');
    api = _api;
}

function destroy() {}

//$(document).ready(function(){
    //console.log('document ready');
//});

    (document.body || document.documentElement).addEventListener(
        'transitionend',
        function(event) {
            if (event.propertyName === 'width' && event.target.id === 'progress') {
                checkNavigation();
            }
        }, 
        true);

    console.log($('p'));
    
    //window.setTimeout(checkNavigation, 5000);
    checkNavigation();

var hello="hello";