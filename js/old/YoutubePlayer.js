// simple Youtube video embedded, based on swfobject

function YoutubePlayer(elementId){
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
			return vidId && ('http://www.youtube.com/v/' + vidId + '?enablejsapi=1&fs=1&autoplay=1');
		},
		play: function(url){
			swfobject.embedSWF(url, elementId, '425', '344', '9.0.0', false, flashvars, params, attributes);
		}
	};
}
