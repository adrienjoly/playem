$(function() {

	if (undefined == window.console) 
		console = { log:function(){} };
		
	console.log("playem init");
	
	var //user = null,
	current = null,
	vids = [],
	playlist = $("#playlist"),
	youtubeRegex = // /^http[s]?\:\/\/(www\.)?youtu(\.)?be(\.com)?\/(watch\?v=)?(v\/)?([a-zA-Z0-9_\-]+)/;
				   // /(https?\:\/\/(www\.)?youtu(\.)?be(\.com)?\/.*(\?v=|\/v\/)([a-zA-Z0-9_\-]+).*)/g;
				   /(youtube\.com\/(v\/|embed\/|(?:.*)?[\?\&]v=)|youtu\.be\/)([a-zA-Z0-9_\-]+)/;

	var chkGroups = false;
	var feedUri = '/me/home';
	var isLoading = false;
	var onNextLoadPage = null;

	// for swf object
	var flashvars = {
		autoplay:1
	}, attributes = {};
	var params = {
		allowFullScreen: "true",
		allowscriptaccess: "always",
		autoplay: 1,
		wmode: "opaque"
	};
  
	var addVid = function (fbItem) {
		var vid = (fbItem.link.match(youtubeRegex) || []).pop(); // youtubeRegex.exec(fbItem.link);
		if (vid) {
			vid = {
				i:vids.length, 
				id:vid, 
				name:fbItem.name, 
				desc:fbItem.description,
				url:'http://www.youtube.com/v/' + vid + '?enablejsapi=1&fs=1&autoplay=1', // /embed/
				from:fbItem.from, 
				time:fbItem.updated_time, 
				msg:fbItem.message,
				fbUrl:fbItem.actions[0].link
			};
			vid.li = $("<li>"+vid.name+"</li>").click(function() {
				playVid(vid)
			}).appendTo(playlist);
			vids.push(vid);
		}
	};
  
	var playVid = function (vid) {
		$("li").css('color', 'gray');
		$("#playCursor").remove();
		window.current = current = vid;
		current.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
		$("#socialPane").html('<p>Shared by:</p><img src="http://graph.facebook.com/' + vid.from.id + '/picture"/>'
			+ '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
			+ '<p class="timestamp"><a href="'+vid.fbUrl+'" title="comment on facebook">' +vid.time + '</a></p>'
			+ '<span class="postShareFB" onclick="shareVideo()">&nbsp;</span>')
		swfobject.embedSWF(vid.url, 'videoEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
		window.playNext = function() {
			playVid(current = vids[vid.i+1 % vids.length]);
		};  
		$("#btnNext").show().unbind().click(window.playNext);
	};

	window.onytplayerStateChange = function (newState) {
		if (newState == 0) // end of video
			playNext();
	};

	window.onYouTubePlayerReady = function (playerId) {
		var embed = document.getElementById("videoEmbed");
		embed.addEventListener("onStateChange", "onytplayerStateChange");
	};

	window.shareVideo = function() {
		var vid = window.current;
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
	
	var loadMore = function(feedUrl) {
		isLoading = true;
		console.log("loadMore..." /*, feedUrl || feedUri*/);
		FB.api(feedUrl || feedUri, {}, function(feed) {
			for (var i in feed.data) {
				var v = feed.data[i];
				//console.log(v);
				if (v && v.type=="video" && v.link)
					addVid(v);
			}
			if (!current && vids.length > 0)
				playVid(vids[0]);
        
			if (onNextLoadPage) {
				onNextLoadPage();
				onNextLoadPage = null;
				return;
			}

			if (feed.data && feed.data.length > 0 && feed.paging)
				loadMore(feed.paging.next);
			else {
				console.log("last feed content", feed);
				isLoading = false;
			}
		});
	};

	function loadGroups(groupHandler) {
		FB.api('/me/groups', {}, function(groups) {
			//console.log("groups", groups);
			if (groups && groups.data)
				for (var i in groups.data)
					groupHandler(groups.data[i]);
		});
	}

	function initGroups() {
		var $selGroup = $("#selGroup").show();
		$selGroup.append(new Option("(personal newsfeed)", "/me/home", true, true));
		$selGroup.change(function(){
			var groupId = $selGroup.val();
			console.log("switching to group: ", groupId);
			function loadGroupFeed() {
				playlist.html("");
				vids = [];
				feedUri = groupId; //'/'+groupId+'/feed';
				current = null;
				loadMore();
			};
			if (isLoading)
				onNextLoadPage = loadGroupFeed;
			else
				loadGroupFeed();
		});
		loadGroups(function(g){
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
			loadMore();
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
	/*
	var modalDialogParams = {
		overlayClose:true,
		onOpen: function (dialog) {
			dialog.overlay.fadeIn('fast', function () {
				dialog.data.hide();
				dialog.container.fadeIn('fast', function () {
					dialog.data.slideDown('fast');
				});
			});
		}
	};
	*/
	var modalContentParams = {
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
	};

	function openVideoOverlay(videoUrl) {
		swfobject.embedSWF(videoUrl, 'modalEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
		$('#modalEmbed').modal(modalContentParams);
	}
  
	var ytLink = window.location.href.indexOf("yt=");
	if (ytLink > 0)
		openVideoOverlay('http://www.youtube.com/v/' + window.location.href.substr(ytLink+3));
	else if (window.startOnLoad)
		loadMore();
});

