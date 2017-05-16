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
				if (v && /*v.type=="video" &&*/ v.link) {
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

function PlayemApp(tracklist){
	var $body = $("body");
	var playlist = $("#playlist");

	var fbImporter = new FacebookImporter();

	fbImporter.onNewVid = function(fbItem) {
		// fbItem reference: https://developers.facebook.com/docs/graph-api/reference/v2.1/post/
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
		vid.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
		$("#socialPane").html('<p>Shared by:</p><img src="https://graph.facebook.com/' + vid.from.id + '/picture"/>'
			+ '<p>' + vid.from.name + (vid.msg ? ": " + vid.msg : "") + '</p>'
			+ '<p class="timestamp"><a href="'+vid.fbUrl+'" title="comment on facebook">' +vid.time + '</a></p>'
			+ '<span class="postShareFB">&nbsp;</span>');
		$(".postShareFB").click(function() {
			var vid = tracklist.current;
			FB.ui({
				method: 'feed',
				name: vid.name,
				link: vid.url,
				message: "This video was originally shared by " + vid.from.name + ".",
				caption: "This video was originally shared by " + vid.from.name + ".",
				description: "Watch your friends' videos in one click, using Play'em. No browsing required, it's just like TV!",
				actions:  {name:'Watch Play\'em TV', link:'https://adrienjoly.com/playem/'}
			});
		});
		$("#btnNext").show().unbind().click(function(){
			tracklist.next();
		});
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

	return self = {
		setMode:function (mode){
			$body[0].className = mode; //["init", "welcome", "main"][mode];
			if (mode == "main")
				fbImporter.loadMore();
		},
		logout: function(){
			//user = null;
			this.setMode("welcome");
		},
		initGroups: initGroups
	};
}

// init

(function init(p){
	var DEFAULTS = {
		design: "default",
		player: "youtube"
	};
	for (var i in DEFAULTS)
		if (!p.hasOwnProperty(i))
			p[i] = DEFAULTS[i];

	console.log("playem parameters:", p);

	var playemApp = null;

	var makeCallback = new WhenDone(function(){
		playemApp.setMode("welcome");
		$("#fbconnect").click(function(e) {
			e.preventDefault();
			var chkGroups = document.getElementById("chkGroups").checked;
			function onFacebookSessionEvent(response) {
				if (response.session || response.authResponse) {
					playemApp.setMode("main");
					if (chkGroups)
						playemApp.initGroups();
				}
				else
					playemApp.logout();
			}
			FB.login(onFacebookSessionEvent, { scope: 'read_stream' + (chkGroups ? ',user_groups' : '') }); // manage_pages	
		});
		if (p.autoplay || window.startOnLoad) {
			playemApp.setMode("main");
		}
	});

	(function initPlayemUI(uiDir, cb){
		var uiDir = uiDir || "/ui-default";
		console.log("loading ui:", uiDir);
		var makeCallback = new WhenDone(cb);
		initFB(makeCallback());
		loadCss(uiDir+"/styles.css", makeCallback());
		loadJS(uiDir+"/ui.js", makeCallback());
	})("/ui-" + keepLettersOnly(p.design), makeCallback());

	(function initPlayer(plDir, cb){
		console.log("loading player:", plDir);
		var playerParams = {
			videoContainer: 'videoEmbed'
		};
		loadJS(plDir + "/main.js", function(){
			makeTracklistPlayer(playerParams, function(tracklistPlayer){
				cb(playemApp = new PlayemApp(tracklistPlayer));
			});
		});
	})("/pl-" + keepLettersOnly(p.player), makeCallback());

})(parseHashParams());
