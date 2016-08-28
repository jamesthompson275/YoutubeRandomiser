/// <reference path="../../jquery.d.ts"/>

console.info('script load');

//TODO...
//YoutubeRandomiserExtension = {};
//YoutubeRandomiserExtension.init();

var api = null;
var songs = [];

var wasPlaying = -1;
var wasTime = -1;
var loop = false;
var shuffle = false;
var disable = false;

var dom = {
    title: null,
    description: null,
    container: null,
    playerContainer: null,
    name: null,
    prevBtn: null,
    nextBtn: null,
    loopBtn: null,
    shuffleBtn: null,
    disableBtn: null,
    tableContainer: null,
    table: null
};

var loaded = false;
var watch = false;

function onNavigate() {
    watch = ('/watch' === location.pathname);

    if (watch) {
        console.log('YTRE NAV: watch page!');
        setup();
        return;
    }
    console.log('YTRE NAV: non-watch page')
    destroy();
}

function ticker(){
    if (!watch) {
        console.warn('YTRE TICK: stop (leaving page)');
        return;
    }
    setNowPlaying();
    window.setTimeout(ticker, 250);
}

function setup(attempt = 0){
    if (!watch) {
        console.info('YTRE INIT: abort (leaving page)');
        return;
    }

    if (attempt > 10) {
        console.error('YTRE INIT: fail (too many retries)');
        return;
    }

    // get player
    var _api = document.getElementById('movie_player');
    if (_api.getCurrentTime === undefined) {
        window.setTimeout(setup, 1000, attempt++);
        console.warn('YTRE INIT: retry (player not found)');
        return;
    }
    api = _api;

    // get DOM elements
    dom.title = $('h1.watch-title-container');
    dom.description = $('p#eow-description');

    if (
        !dom.title.length || 
        !dom.description.length
    ) {
        console.error('YTRE INIT: fail (DOM elements missing)');
        return;
    }

    // get songs
    songs = getSongs();
    if (!songs.length) {
        console.warn('YTRE INIT: abort (no songs in description)');
        return;
    }

    // create DOM elements
    var btnClasses = 'class="yt-uix-button yt-uix-button-default yt-uix-button-size-default"';
    dom.title.after(`
        <div id="YoutubeRandomiserExtension">
            <div id="YTREPlayerContainer">
                <div style="margin: 5px;">
                    <b>Now Playing : </b>
                    <span id="YTRESongName" style="margin: 10px"> ... </span>
                </div>
                <div>
                    <button `+btnClasses+` id="YTREPrevBtn">    prev    </button>
                    <button `+btnClasses+` id="YTRENextBtn">    next    </button>
                    <button `+btnClasses+` id="YTREShuffleBtn"> shuffle </button>
                    <button `+btnClasses+` id="YTRELoopBtn">    loop    </button>
                    <button `+btnClasses+` id="YTREDisableBtn"> disable </button>
                </div>
            </div>
            <div id="YTRETableContainer">
                <table id="YTRETable">
                </table>
            </div>
        </div>
    `);
    dom.container = $('#YoutubeRandomiserExtension');
    dom.tableContainer = $('#YTRETableContainer');
    dom.playerContainer = $('#YTREPlayerContainer');
    dom.table = $('#YTRETable');
    dom.songName = $('#YTRESongName');
    dom.prevBtn = $('#YTREPrevBtn');
    dom.nextBtn = $('#YTRENextBtn');
    dom.loopBtn = $('#YTRELoopBtn');
    dom.shuffleBtn = $('#YTREShuffleBtn');
    dom.disableBtn = $('#YTREDisableBtn');

    if (
        !dom.container.length || 
        !dom.tableContainer.length || 
        !dom.playerContainer.length || 
        !dom.table.length ||
        !dom.songName.length ||
        !dom.prevBtn.length ||
        !dom.nextBtn.length ||
        !dom.loopBtn.length ||
        !dom.shuffleBtn.length
    ) {
        console.error('YTRE INIT: fail (DOM create failed)');
        return;
    }

    // populate songs table
    createSongTable();

    // bind songs table events
    //TODO...

    // bind normal button events
    //TODO...

    //$(div).html(s)
    //$(div).append(s)
    //$(div).before(s)
    //$(div).after(s)

    loaded = true;
    console.info('YTRE INIT: done!');
    bind();
    tableBind();
    testEvents();
    ticker();
}

function bind() {
    // click events

    dom.loopBtn.on('click', function(e){
        loop = !loop;
        dom.loopBtn.css('background-color', loop ? 'lightgray' : '');
    });

    dom.shuffleBtn.on('click', function(e){
        shuffle = !shuffle;
        setOrder(shuffle);
        dom.shuffleBtn.css('background-color', shuffle ? 'lightgray' : '');
    });

    dom.disableBtn.on('click', function(e){
        disable = !disable;
        dom.disableBtn.css('background-color', disable ? 'lightgray' : '');
        dom.table.css('color', disable ? 'lightgray' : 'black');
        dom.title.css('color', disable ? 'black' : 'lightgray');
        disable ? dom.prevBtn.attr('disabled', 'true') : dom.prevBtn.removeAttr('disabled');
        disable ? dom.nextBtn.attr('disabled', 'true') : dom.nextBtn.removeAttr('disabled');
        disable ? dom.shuffleBtn.attr('disabled', 'true') : dom.shuffleBtn.removeAttr('disabled');
        disable ? dom.loopBtn.attr('disabled', 'true') : dom.loopBtn.removeAttr('disabled');
    });

    dom.prevBtn.on('click', function(e){
    });

    
}

function tableBind(){
	$('.playNow').on('click', function(e) {
    	var idx = e.target.parentElement.parentElement.getAttribute('id').substring(4);
    	for (i = 0; i < songs.length; i++) {
    		if (idx == songs[i].idx) {
    			api.seekTo(songs[i].startTime, true);
    		}
    	}
    });

    $('.moveUp').on('click', function(e) {   	
    	var idx = e.target.parentElement.parentElement.getAttribute('id').substring(4);
    	for (i = 1; i < songs.length; i++) {
    		if (idx == songs[i].idx) {
    			var tmp = songs[i-1];
    			songs[i-1] = songs[i];
    			songs[i] = tmp;
    			purgeBuildTable();
    		}
    	}
    });

    $('.moveDown').on('click', function(e) {
    	var idx = e.target.parentElement.parentElement.getAttribute('id').substring(4);

    	for (i = 0; i < songs.length - 1; i++) {
    		if (idx == songs[i].idx) {
    			var tmp = songs[i+1];
    			songs[i+1] = songs[i];
    			songs[i] = tmp;
    			purgeBuildTable();
    		}
    	}
    });
}

function destroy() {}

function init() {
    (document.body || document.documentElement).addEventListener(
        'transitionend',
        function(event) {
            if (event.propertyName === 'width' && event.target.id === 'progress') {
                onNavigate();
            }
        }, 
        true);

    onNavigate();
}

function getSongs() {

    // get description parts
    var s = '<p>' + dom.description[0].outerHTML.split('<br>').join('</p><p>') + '</p>';
    var d = $.parseHTML(s);
    var duration = api.getDuration();

    if (!duration) {
        console.error('YTRE INIT: failed to retrieve non-zero video duration');
        return [];
    }

    songList = [];
    d.forEach(function(p, i){
        var a = $(p).find('a[href="#"]');
        if (!a.length) return;

        // get start time
        var timeSplit = a[0].text.split(":");
        var timeSplitLen = timeSplit.length;
        var startTime = 0;
        for (i = 0; i < timeSplitLen; i++) {
            startTime += parseInt(timeSplit[i])*Math.pow(60,timeSplitLen-1-i);
        }

        // get song name
        var name = $(p).contents().filter(function() {
            return this.nodeType == 3;
        }).text() || 'Unknown Song';

        var song = {
            idx: songList.length,
            name: name,
            startTime: startTime,
            endTime: Math.floor(duration)
        };
        songList.push(song);
    });
    for (i = 0; i < songList.length-1; i++) {
        songList[i].endTime = songList[i+1].startTime;
    }

    console.log(songList);
    return songList;
}

function unsort(array) {
    var idx = array.length;
    var randomIdx;
    var temp;

    while (0 !== idx) {
        randomIdx = Math.floor(Math.random() * idx);
        idx -= 1;
        temp = array[idx];
        array[idx] = array[randomIdx];
        array[randomIdx] = temp;
    }

    return array;
}

function sort(songList) {
    songList.sort(function(s1, s2) {
        return s1.idx - s2.idx;
    });
    return songList;
}

function getCurrentSongIndex(time) {
	for (i = 0; i < songs.length; i++) {
		if (time >= songs[i].startTime &&
			time < songs[i].endTime) {
			return i;
		}
	}
}

function setOrder(shuffle) {
	songs = shuffle ? unsort(songs) : sort(songs);
	api.seekTo(songs[0].startTime,true);
	wasPlaying = songs[0];
	wasTime = songs[0].startTime
}

function purgeBuildTable() {
	dom.table[0].innerHTML="";
	createSongTable();
	tableBind();
}

function createSongTable() {
	for (i = 0; i < songs.length; i++) {
		var row = dom.table[0].insertRow(-1);
		var cell0 = row.insertCell(0);
		var cell1 = row.insertCell(1);
		var cell2 = row.insertCell(2);
		row.setAttribute("id", "song"+songs[i].idx);
		var lenSec = songs[i].endTime - songs[i].startTime;
		var lenMin = Math.floor(lenSec / 60);
		lenSec -= lenMin*60;
		if (lenSec < 10) {
			lenSec= "0"+lenSec;
		}
		cell0.innerHTML = songs[i].name;
		cell1.innerHTML = lenMin+":"+lenSec;
		cell2.innerHTML = "<span class='playNow'>\u25B6</span>"+
							"<span class='moveUp'>\u2227</span>"+
							"<span class='moveDown'>\u2228</span>";
	}
}

function setNowPlaying() {

	var time = api.getCurrentTime();
    var endTime = api.getDuration();
	var playing = getCurrentSongIndex(time);

    // small time jump; different but defined song
    if (
        (((Math.abs(time - wasTime) < 0.5) && (playing !== wasPlaying)) ||
          (Math.abs(time - endTime) < 0.5)) &&
          !disable
    )
    {
        //set playing to the 'next' song; move the player

        if (wasPlaying < songs.length - 1) {
            playing = wasPlaying + 1;
        }
        else {
            if (loop) {
                playing = 0;
            }
            else {
                wasPlaying = -1;
                wasTime = -1;
                if (Math.abs(time - endTime) < 0.5) {
                    api.seekTo(endTime - 1, true);
                }
                api.pauseVideo();
                return;
            }
        }
        //move the player
        var seekTime = songs[playing].startTime;
        api.seekTo(seekTime, true);
    }

    // different but defined song
    if (
        (playing !== undefined) &&
        (playing !== -1) &&
        (playing !== wasPlaying)
    )
    {
        //update songName
        dom.songName.text(songs[playing].name);
        dom.songName.animate( 
            {opacity:0}, 
            200, 
            "linear", 
            function(){
                $(this).animate({opacity:1},200);
            })

        //update table
        for (i = 0; i < songs.length; i++) {
			var idx = songs[i].idx;
			$('#song'+idx).removeClass("currentSong");
			if (playing == i) {
				$('#song'+idx).addClass("currentSong");
			}
		}
    }

    wasPlaying = playing  
    if (!disable) wasTime = time;
}

function testEvents() {
    // run test code here
}


init();

/*
    Major features todo:
        - implement next/prev btns on player
        - add up/dn buttons on table, with hide/show on hover
        - add 'play now' buttons on table
        - glyphicons for some buttons
        ...
        - implement on/off checkbox for the extension menu. 'refresh to see changes'
        - implement destroy() when you switch pages
        - drag n drop
*/
