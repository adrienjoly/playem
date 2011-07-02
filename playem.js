$(window).ready(function() {

	if (undefined == window.console) 
		console = {
			log:function(){}
		};
	
	var //user = null,
	current = null,
	vids = [],
	feedOffset = 0,
	playlist = $("#playlist"),
	youtubeRegex = /^http[s]?\:\/\/(www\.)?youtu(\.)?be(\.com)?\/(watch\?v=)?(v\/)?([a-zA-Z0-9_\-]+)/;

	var flashvars = {
		autoplay:1
	}, attributes = {};
	var params = {
		allowFullScreen: "true",
		allowscriptaccess: "always",
		autoplay: 1
	//wmode: "opaque"
	};

	FB.init({
		appId: "143116132424011", 
		status: true, 
		cookie: true, 
		xfbml: true
	});
  
	var addVid = function (fbItem) {
		var vidUrl = fbItem.link;
		console.log(vidUrl);
		var vid = vidUrl.match(youtubeRegex);
		if (vid) {
			vid = vid.pop();
			vid = {
				i:vids.length, 
				id:vid, 
				name:fbItem.name, 
				desc:fbItem.description,
				url:'http://www.youtube.com/v/' + vid + '?enablejsapi=1&fs=1',
				from:fbItem.from, 
				time:fbItem.updated_time, 
				msg:fbItem.message,
				fbUrl:fbItem.actions[0].link
			};
			//console.log("adding", vid.name, vid);
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
		//console.log("playing", vid.name);
		current.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
		$("#socialPane").html('<p>Shared by:</p><img src="http://graph.facebook.com/' + vid.from.id + '/picture"/>'
			+ '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
			+ '<p class="timestamp"><a href="'+vid.fbUrl+'" title="comment on facebook">' +vid.time + '</a></p>'
			+ '<span class="postShareFB" onclick="shareVideo">&nbsp;</span>')
		swfobject.embedSWF(vid.url, 'videoEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
    
		window.playNext = function() {
			//console.log("playNext");
			playVid(current = vids[vid.i+1 % vids.length]);
		};  
	};
  
	window.onytplayerStateChange = function (newState) {
		//console.log("newState", newState);
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
				message: "I have found this great video shared by " + vid.from + ", thanks to Play'em!",
				name: vid.name,
				link: 'http://playem.org/?yt='+vid.id,
				picture: 'http://playem.org/playem.png',
				caption: "I have found this great video shared by " + vid.from + ", thanks to Play'em!",
				description: "Play'em is a simple way to watch the cool videos you friends share on Facebook. Play in one click, no browsing required, just like TV!",
				actions:  {name:'Watch my friend\'s TV', link:'http://playem.org/'}
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
  
	var loadMore = function(until) {
		console.log("loadMore", feedOffset, until);
		var params = until ? {
			until:until
		} : {};
		FB.api('/me/home', params, function(feed) {
			for (var i in feed.data) {
				/*console.log*/(i = feed.data[i]);
				if (i.type=="video" && i.link)
					addVid(i);
			}
			if (!current && vids.length > 0)
				playVid(vids[0]);
        
			feedOffset += feed.data.length;
			if (feed.data.length > 0 /*&& vids.length < 10 && feedOffset < 200*/)
				loadMore(feed.paging.next.substr(feed.paging.next.lastIndexOf("=")+1));
		});
	};
  
	var onFacebookSessionEvent = function(response) {
		if (response.session) {
			$("#welcome").hide();
			$("#container").show();
			loadMore();
		}
		else {
			$("#welcome").show();
			$("#container").hide();
			user = null;
		}
	};

	login = function(nextPage) {
		var handler = nextPage ? function(){
			window.location.href = nextPage;
		} : onFacebookSessionEvent;
		FB.login(handler, {
			perms:'read_stream'
		});
	};
  
	if (window.startOnLoad)
		loadMore();
});

