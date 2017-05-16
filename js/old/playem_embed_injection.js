$(function() {

	if (undefined == window.console) 
		console = { log:function(){} };
		
	console.log("playem init");
	
	var //user = null,
	current = null,
	vids = [],
	feedOffset = 0,
	playlist = $("#playlist"),
	$videoEmbed = $("#videoEmbed");

  	var embedder = ContentEmbed({
		detectTypes: ["yt", "dm", "vi", "sc"/*, "wy"*/],
		ignoreContentType: true
  	});


  	var embedParams = {
  		autoplay:1,
  		width: $videoEmbed.css("width"),
  		height: $videoEmbed.css("height")
  	};

	var addVid = function (fbItem) {
		var vidUrl = fbItem.link;
		embedder.extractEmbedRef(vidUrl, function(embedRef){
			if (embedRef && embedRef.id /*&& embedRef.id.indexOf("/yt/") == 0*/) {
				var vid = embedRef.id.substr(4);
				vid = {
					i:vids.length, 
					id:vid,
					//url:'https://www.youtube.com/v/' + vid + '?enablejsapi=1&fs=1&autoplay=1', // /embed/
					html: embedRef.embedType.render(embedRef, embedParams),
					name:fbItem.name, 
					desc:fbItem.description,
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
		});
	};
  
	var playVid = function (vid) {
		$("li").css('color', 'gray');
		$("#playCursor").remove();
		window.current = current = vid;
		current.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
		$("#socialPane").html('<p>Shared by:</p><img src="https://graph.facebook.com/' + vid.from.id + '/picture"/>'
			+ '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
			+ '<p class="timestamp"><a href="'+vid.fbUrl+'" title="comment on facebook">' +vid.time + '</a></p>'
			+ '<span class="postShareFB" onclick="shareVideo()">&nbsp;</span>')
		//swfobject.embedSWF(vid.url, 'videoEmbed', '425', '344', '9.0.0', '', flashvars, params, attributes);
		$videoEmbed.html(vid.html);

		var iframe = /*window.top.*/$(".youtube-player");
		iframe.contents().append("<script>function onYouTubePlayerReady(playerId) { alert('coucou ' + playerId) } </script>");
		console.log("coucou", iframe, iframe.contents());
		/*
		if (iframe.length == 0) {
		    var html = "<html><head><script type='text/javascript'>"
		                + "this.window.doThis = function() { alert('woot'); };"
		                + "</script></head><body></body></html>";
		    iframe = window.top.$("<iframe id='dummyIFrame'>")
		                .append(html)
		                .hide()
		                .css("width", "0px")
		                .css("height", "0px");
		    window.top.$("body").append(iframe);
		}
		*/
		window.playNext = function() {
			playVid(current = vids[vid.i+1 % vids.length]);
		};  
	};
	
	window.onytplayerStateChange = function (newState) {
		console.log("player state", newState);
		if (newState == 0) // end of video
			playNext();
	};

	window.top.onYouTubePlayerReady = function (playerId) {
		console.log("player ready", playerId);
		var embed = document.getElementById("videoEmbed");
		embed.addEventListener("onStateChange", "onytplayerStateChange");
	};

	window.shareVideo = function() {
		var vid = window.current;
		FB.ui({
				method: 'feed',
				message: "I have found this great video shared by " + vid.from.name + ", thanks to Play'em!",
				name: vid.name,
				link: 'https://adrienjoly.com/playem/#yt='+vid.id,
				picture: 'https://i.ytimg.com/vi/' + vid.id + '/0.jpg', //'https://adrienjoly.com/playem/playem.png',
				caption: "I have found this great video shared by " + vid.from.name + ", thanks to Play'em!",
				description: "Play'em is a simple way to watch the cool videos you friends share on Facebook. Play in one click, no browsing required, just like TV!",
				actions:  {name:'Watch Play\'em TV', link:'https://adrienjoly.com/playem/'}
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
  
	// called when the user clicks the facebook connect button

	var onFacebookSessionEvent = function(response) {
		console.log("facebook response", response);
		if (response.session || response.authResponse) {
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

	window.login = function(nextPage) {
		var handler = nextPage ? function(){
			window.location.href = nextPage;
		} : onFacebookSessionEvent;
		console.log("FB.login...");
		FB.login(handler, {
			scope:'read_stream'  // oauth 2.0
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
		openVideoOverlay('https://www.youtube.com/v/' + window.location.href.substr(ytLink+3));
	else if (window.startOnLoad)
		loadMore();
});

