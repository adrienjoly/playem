var ytPlayer = new (function YoutubePlayer(elementId){
	// for swf object
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
			return (url.match(youtubeRegex) || []).pop(); // youtubeRegex.exec(fbItem.link);
		},
		play: function(url){
			swfobject.embedSWF(url, elementId, '425', '344', '9.0.0', false, flashvars, params, attributes);
		}
	};
})('videoEmbed');

function Tracklist(){
	return {
		onTrackPlaying: null,
		current: null,
		vids: [],
		clear: function(){
			this.vids = [];
			this.current = null;
		},
		addTrack: function(fbItem){
			var vid = ytPlayer.detect(fbItem.link)
			if (vid) {
				vid = {
					i:this.vids.length,
					id:vid,
					name:fbItem.name,
					desc:fbItem.description,
					url:'http://www.youtube.com/v/' + vid + '?enablejsapi=1&fs=1&autoplay=1', // /embed/
					from:fbItem.from,
					time:fbItem.updated_time,
					msg:fbItem.message,
					fbUrl:fbItem.actions[0].link
				};
				this.vids.push(vid);
			}
			return vid;
		},
		play: function(index){
			var self = this;
			console.log("play", index || 0, this.vids[index || 0]);
			this.current = this.vids[index || 0];
			ytPlayer.play(this.current.url);
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

function FacebookImporter(){
	var self = this;
	var isLoading = false;
	var feedUri = '/me/home';
	var onNextLoadPage = null;
	this.onNewVid = null;

	this.loadMore = function(feedUrl) {
		var self = this;
		isLoading = true;
		console.log("loadMore..." /*, feedUrl || feedUri*/);
		FB.api(feedUrl || feedUri, {}, function(feed) {
			for (var i in feed.data) {
				var v = feed.data[i];
				//console.log(v);
				if (v && v.type=="video" && v.link) {
					self.onNewVid(v);
				}
			}
			if (onNextLoadPage) {
				onNextLoadPage();
				onNextLoadPage = null;
				return;
			}

			if (feed.data && feed.data.length > 0 && feed.paging)
				self.loadMore(feed.paging.next);
			else {
				console.log("last feed content", feed);
				isLoading = false;
			}
		});
	};

	this.loadGroups = function(groupHandler) {
		FB.api('/me/groups', {}, function(groups) {
			//console.log("groups", groups);
			if (groups && groups.data)
				for (var i in groups.data)
					groupHandler(groups.data[i]);
		});
	}

	this.switchToGroup = function(groupId, cb){
		function loadGroupFeed(){
			cb();
			feedUri = groupId; //'/'+groupId+'/feed';
			self.loadMore();
		}
		if (isLoading)
			onNextLoadPage = loadGroupFeed;
		else
			loadGroupFeed();
	}
}

$(function() {

	var tracklist = new Tracklist();
	var fbImporter = new FacebookImporter();

	var playlist = $("#playlist");
	var chkGroups = false;

	fbImporter.onNewVid = function(fbItem) {
		var vid = tracklist.addTrack(fbItem);
		if (vid) {
			vid.li = $("<li>"+vid.name+"</li>").click(function() {
				tracklist.play(vid.i);
			}).appendTo(playlist);
			if (!tracklist.current)
				tracklist.play();
		}
	};

	tracklist.onTrackPlaying = function(vid) {
		$("li").css('color', 'gray');
		$("#playCursor").remove();
		//window.current = current = vid;
		vid.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
		$("#socialPane").html('<p>Shared by:</p><img src="http://graph.facebook.com/' + vid.from.id + '/picture"/>'
			+ '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
			+ '<p class="timestamp"><a href="'+vid.fbUrl+'" title="comment on facebook">' +vid.time + '</a></p>'
			+ '<span class="postShareFB" onclick="shareVideo()">&nbsp;</span>')
		$("#btnNext").show().unbind().click(function(){
			tracklist.next();
		});
	};

	window.shareVideo = function() {
		var vid = tracklist.current;
		FB.ui({
				method: 'feed',
				message: "I have found this great video shared by " + vid.from.name + ", thanks to Play'em!",
				name: vid.name,
				link: 'http://www.playem.org/#yt='+vid.id,
				picture: 'http://i.ytimg.com/vi/' + vid.id + '/0.jpg', //'http://playem.org/playem.png',
				caption: "I have found this great video shared by " + vid.from.name + ", thanks to Play'em!",
				description: "Play'em is a simple way to watch the cool videos you friends share on Facebook. Play in one click, no browsing required, just like TV!",
				actions:  {name:'Watch Play\'em TV', link:'http://playem.org/'}
			},
			function(response) {
				if (response && response.post_id) {
					//alert('Post was published.');
				} else {
					//alert('Post was not published.');
				}
			}
		);
	};

	function initGroups() {
		var $selGroup = $("#selGroup").show();
		$selGroup.append(new Option("(personal newsfeed)", "/me/home", true, true));
		$selGroup.change(function(){
			var groupId = $selGroup.val();
			console.log("switching to group: ", groupId);
			fbImporter.switchToGroup(groupId, function(){
				playlist.html("");
				tracklist.clear();
			});
		});
		fbImporter.loadGroups(function(g){
			$selGroup.append(new Option(g.name, "/" + g.id + "/feed" /*, true, true*/));
		});
	}

	// called when the user clicks the facebook connect button

	var onFacebookSessionEvent = function(response) {
		console.log("facebook response", response);
		if (response.session || response.authResponse) {
			$("#welcome").hide();
			$("#container").show();
			if (chkGroups)
				initGroups();
			fbImporter.loadMore();
		}
		else {
			$("#welcome").show();
			$("#container").hide();
			user = null;
		}
	};

	window.login = function(nextPage) {
		var handler = nextPage ? function(){
			window.location.href = nextPage;
		} : onFacebookSessionEvent;
		console.log("FB.login...");
		chkGroups = document.getElementById("chkGroups").checked;
		FB.login(handler, {
			scope: 'read_stream' + chkGroups ? ',user_groups' : ''  // manage_pages
		});
	};

	// called when a video link is attached to the URL (e.g. from facebook shared link)
	function openVideoOverlay(videoUrl) {
		swfobject.embedSWF(videoUrl, 'modalEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
		$('#modalEmbed').modal({
			overlayClose:true,
			overlayCss:{"background-color":"black"},
			containerCss:{ height:"350px", width:"430px", filter:"alpha(opacity=100)", "-moz-opacity":1, opacity:1},
				onOpen: function (dialog) {
					dialog.overlay.fadeIn('fast', function () {
						dialog.container.fadeIn('fast', function () {
							dialog.data.show();
						});
					});
				}
		});
	}
  
	var ytLink = window.location.href.indexOf("yt=");
	if (ytLink > 0)
		openVideoOverlay('http://www.youtube.com/v/' + window.location.href.substr(ytLink+3));
	else if (window.startOnLoad)
		fbImporter.loadMore();
});

