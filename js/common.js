var inProd = window.location.href.indexOf("http://www.playem.org/") == 0;

if (undefined == window.console)
	console = { log:function(){} };

console.log("playem init...");

// facebook
function initFB(cb) {
	window.fbAsyncInit = function() {
		FB.init({
			appId: inProd ? "143116132424011" : "222312447801944", 
			status: true, 
			cookie: true, 
			xfbml: true,
			oauth : true,
			channelUrl : 'http://www.playem.org/channel.html'
		});
		cb();
	};
	var e = document.createElement('script');
	e.src = document.location.protocol + '//connect.facebook.net/en_US/all.js';
	e.async = true;
	document.getElementById('fb-root').appendChild(e);
};

// google analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-1858235-3']);
_gaq.push(['_trackPageview']);
(function() {
	var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

// begin olark code
window.olark||(function(i){var e=window,h=document,a=e.location.protocol=="https:"?"https:":"http:",g=i.name,b="load";(function(){e[g]=function(){(c.s=c.s||[]).push(arguments)};var c=e[g]._={},f=i.methods.length; while(f--){(function(j){e[g][j]=function(){e[g]("call",j,arguments)}})(i.methods[f])} c.l=i.loader;c.i=arguments.callee;c.f=setTimeout(function(){if(c.f){(new Image).src=a+"//"+c.l.replace(".js",".png")+"&"+escape(e.location.href)}c.f=null},20000);c.p={0:+new Date};c.P=function(j){c.p[j]=new Date-c.p[0]};function d(){c.P(b);e[g](b)}e.addEventListener?e.addEventListener(b,d,false):e.attachEvent("on"+b,d); (function(){function l(j){j="head";return["<",j,"></",j,"><",z,' onl'+'oad="var d=',B,";d.getElementsByTagName('head')[0].",y,"(d.",A,"('script')).",u,"='",a,"//",c.l,"'",'"',"></",z,">"].join("")}var z="body",s=h[z];if(!s){return setTimeout(arguments.callee,100)}c.P(1);var y="appendChild",A="createElement",u="src",r=h[A]("div"),G=r[y](h[A](g)),D=h[A]("iframe"),B="document",C="domain",q;r.style.display="none";s.insertBefore(r,s.firstChild).id=g;D.frameBorder="0";D.id=g+"-loader";if(/MSIE[ ]+6/.test(navigator.userAgent)){D.src="javascript:false"} D.allowTransparency="true";G[y](D);try{D.contentWindow[B].open()}catch(F){i[C]=h[C];q="javascript:var d="+B+".open();d.domain='"+h.domain+"';";D[u]=q+"void(0);"}try{var H=D.contentWindow[B];H.write(l());H.close()}catch(E){D[u]=q+'d.write("'+l().replace(/"/g,String.fromCharCode(92)+'"')+'");d.close();'}c.P(2)})()})()})({loader:(function(a){return "static.olark.com/jsclient/loader0.js?ts="+(a?a[1]:(+new Date))})(document.cookie.match(/olarkld=([0-9]+)/)),name:"olark",methods:["configure","extend","declare","identify"]});
olark.identify('6373-737-10-6529');

// utility classes and functions

function loadCss(path, cb){
	$.get(path, function(response){
		$('<style></style>').text(response).appendTo('head');
		cb && cb();
	});
}

function loadJS(path, cb){
	$.getScript(path, cb);
}

function WhenDone(cb){
	var remaining = 0;
	function providedCallback(cb2){
		if (typeof cb2 == "function")
			cb2();
		if (!--remaining)
			cb();
	}
	return function(){
		++remaining;
		return providedCallback;
	}
};

function keepLettersOnly(str) {
	return (""+str).replace(/[^\w]/g, "");
}

function parseHashParams(){
	var params = {}, strings = window.location.href.split(/[#&]+/).slice(1);
	for (var i in strings) {
		var splitted = strings[i].split("=");
		params[decodeURIComponent(splitted[0])] = typeof(splitted[1]) == "string" ? decodeURIComponent(splitted[1]) : null;
	}
	return params;
}

// main classes

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

function PlayemApp(tracklist){
	var $body = $("body");
	var playlist = $("#playlist");

	var fbImporter = new FacebookImporter();

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
		vid.li.css('color', 'white').prepend("<span id='playCursor'>► </span>");
		$("#socialPane").html('<p>Shared by:</p><img src="http://graph.facebook.com/' + vid.from.id + '/picture"/>'
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
				actions:  {name:'Watch Play\'em TV', link:'http://playem.org/'}
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

function initPlayemUI(uiDir, cb){
	var uiDir = uiDir || "/ui-default";
	var makeCallback = new WhenDone(cb);
	initFB(makeCallback());
	loadCss(uiDir+"/styles.css", makeCallback());
	loadJS(uiDir+"/ui.js", makeCallback());
}

function initPlayer(cb){
	loadJS("/js/old/YoutubePlayer.js", function(){
		window.ytPlayer = new YoutubePlayer('videoEmbed');
		cb();
	});
	return;
	loadJS("/js/playemWrapper.js", function(){
		loadSoundManager(function(){
			initPlayem(document.getElementById("videoEmbed"), "videoPlayer", function(playem){
				console.info("playemjs is ready!");
				window.playemWrapper = new PlayemWrapper(playem);
				cb();
				/*
				forEachElement("li", function(element) {
					var wtn = element.getAttribute("data-wtn"); // whyd track number
					if (wtn !== null)
						element.onclick = function(){
							playem.play(wtn);
						};
				});
				*/
			});
		});
	});
}

(function init(p){
	var DEFAULTS = {
		design: "default"
	};
	for (var i in DEFAULTS)
		if (!p.hasOwnProperty(i))
			p[i] = DEFAULTS[i];

	var makeCallback = new WhenDone(function(){
		var tracklist = window.ytPlayer ? new Tracklist(ytPlayer) : playemWrapper;
		var playemApp = new PlayemApp(tracklist);
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
			FB.login(onFacebookSessionEvent, { scope: 'read_stream' + chkGroups ? ',user_groups' : '' }); // manage_pages	
		});
		if (p.autoplay || window.startOnLoad) {
			playemApp.setMode("main");
		}
	});

	initPlayemUI("/ui-" + keepLettersOnly(p.design), makeCallback(/*function(){
		playemApp.setMode("welcome");
	}*/));

	initPlayer(makeCallback());

})(parseHashParams());
