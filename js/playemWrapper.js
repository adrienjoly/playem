window.SOUNDCLOUD_CLIENT_ID = "9d5bbaf9df494a4c23475d9fde1f69b4";
window.DEBUG = false; // for soundmanager
//window.DEEZER_APP_ID = 125765;
//window.DEEZER_CHANNEL_URL = window.location.href.substr(0, window.location.href.indexOf("/", 10)) + "/channel.html";

// components

function initPlayem(playerContainer, playerId, cb) {
	console.info("initializing players...");
	var playem, PLAYERS = [
			"Youtube",
			"SoundCloud",
			"Vimeo",
			"Dailymotion",
		//	"Deezer",
			"AudioFile",
			"Bandcamp"
		],
		PLAYER_PARAMS = {
			playerId: playerId,
			origin: window.location.host || window.location.hostname,
			width: playerContainer.clientWidth,
			height: playerContainer.clientHeight,
			playerContainer: playerContainer
		};
	loadJS("/js/playem-min.js", function(){
		playem = new Playem();
		PLAYERS.map(function(pl) {
			//console.log("Init " + pl + " player...");
			playem.addPlayer(window[pl + "Player"], PLAYER_PARAMS);
		});
		cb(playem);
	});
}

function loadSoundManager(cb){
	//console.info("initializing soundmanager2...");
	loadJS("/js/soundmanager2" + (DEBUG ? ".js" : "-nodebug-jsmin.js"), function(){
		soundManager.setup({debugMode: DEBUG, url: "/swf/soundmanager2_xdomain.swf", flashVersion: 9, onready: function() {
			soundManager.isReady=true;
		}});
		soundManager.beginDelayedInit();
	});
	cb();
}

// actual init

var shortcuts = {
	"/yt/": window.location.protocol+"//youtube.com/v/",
	"/sc/": window.location.protocol+"//soundcloud.com/",
	"/dm/": window.location.protocol+"//dailymotion.com/video/",
	"/vi/": window.location.protocol+"//vimeo.com/",
	"/dz/": window.location.protocol+"//www.deezer.com/track/"
};

function getTrackUrl(eId){
	for (var s in shortcuts)
		if (eId.indexOf(s) == 0)
			return eId.replace(s, shortcuts[s]);
	return eId;
}

function PlayemWrapper(playem){
	playem.on("onTrackChange", function(track){
		self.onTrackPlaying(track.metadata);
	});
	return self = {
		onTrackPlaying: null,
		clear: function(){
			playem.clearQueue();
		},
		addTrack: function(fbItem){
			return playem.addTrackByUrl(fbItem.link, {
				i: this.vids.length,
				eId: embedId, // id
				//url: embedId,
				url: fbItem.link,
				name: fbItem.name,
				desc: fbItem.description,
				from: fbItem.from,
				time: fbItem.updated_time,
				msg: fbItem.message,
				fbUrl: fbItem.actions[0].link
			});
		},
		play: function(index){
			var self = this;
			playem.play(index);
		},
		next: function(){
			playem.next();
		}
	};
}
