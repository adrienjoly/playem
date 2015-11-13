// simple Youtube video embedded, based on swfobject

function YoutubePlayer(elementId){
	var self;
	var flashvars = {
		autoplay:1
	};
	var params = {
		allowFullScreen: "true",
		allowscriptaccess: "always",
		autoplay: 1,
		wmode: "opaque"
	};
	var attributes = {};

	var embedElement = null;
	var youtubeRegex = // /^http[s]?\:\/\/(www\.)?youtu(\.)?be(\.com)?\/(watch\?v=)?(v\/)?([a-zA-Z0-9_\-]+)/;
				   // /(https?\:\/\/(www\.)?youtu(\.)?be(\.com)?\/.*(\?v=|\/v\/)([a-zA-Z0-9_\-]+).*)/g;
				   /(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/;

	window.onytplayerStateChange = function (newState) {
		if (newState == 0) // end of video
			setTimeout(function(){
				self.onEnd();
			});
	};

	window.onYouTubePlayerReady = function (playerId) {
		embedElement = document.getElementById(elementId);
		embedElement.addEventListener("onStateChange", "onytplayerStateChange");
	};

	return self = {
		onEnd: null,
		detect: function(url){
			var vidId = (url.match(youtubeRegex) || []).pop(); // youtubeRegex.exec(fbItem.link);
			return vidId && ('https://www.youtube.com/v/' + vidId + '?enablejsapi=1&fs=1&autoplay=1');
		},
		play: function(url){
			swfobject.embedSWF(url, elementId, '425', '344', '9.0.0', false, flashvars, params, attributes);
		}
	};
}

function Tracklist(ytPlayer){
	return {
		onTrackPlaying: null,
		current: null,
		vids: [],
		clear: function(){
			this.vids = [];
			this.current = null;
		},
		addTrack: function(fbItem){
			var track = null, embedId = ytPlayer.detect(fbItem.link);
			if (embedId) {
				track = {
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
				};
				this.vids.push(track);
			}
			return track;
		},
		play: function(index){
			var self = this;
			console.log("play", index || 0, this.vids[index || 0]);
			this.current = this.vids[index || 0];
			ytPlayer.play(this.current.eId);
			ytPlayer.onEnd = function() {
				console.log("onEnd");
				self.next();
			};
			this.onTrackPlaying(this.current);
		},
		next: function(){
			this.play(this.current.i+1 % this.vids.length);
		}
	};
}

function makeTracklistPlayer(p, cb){
	cb(new Tracklist(new YoutubePlayer(p.videoContainer)));
}
