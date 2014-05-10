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
	function providedCallback(){
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

// init

function initPlayemUI(uiDir){
	var uiDir = uiDir || "/ui-default";
	var makeCallback = new WhenDone(function(){
		$("body")[0].className = "welcome";
	});
	initFB(makeCallback());
	loadCss(uiDir+"/styles.css", makeCallback());
	loadJS(uiDir+"/ui.js", makeCallback());
}

function initPlayer(){
	loadJS("/js/old/YoutubePlayer.js", function(){
		loadJS("/js/playem.js");
	});
}

var DEFAULTS = {
	design: "default"
};

(function init(p){
	for (var i in DEFAULTS)
		if (!p.hasOwnProperty(i))
			p[i] = DEFAULTS[i];
	initPlayemUI("/ui-" + keepLettersOnly(p.design));
	initPlayer();
})((function readHashParams(){
	var params = {}, strings = window.location.href.split(/[#&]+/).slice(1);
	for (var i in strings) {
		var splitted = strings[i].split("=");
		params[decodeURIComponent(splitted[0])] = typeof(splitted[1]) == "string" ? decodeURIComponent(splitted[1]) : null;
	}
	return params;
})());
