var inProd = window.location.href.indexOf("http://www.playem.org/") == 0;

if (undefined == window.console)
	console = { log:function(){} };

console.log("playem init...");

// facebook
function initFB(cb) {
	window.fbAsyncInit = function() {
		FB.init({
			appId: inProd ? "143116132424011" : "222312447801944",
			version: 'v2.0',
			status: true, 
			cookie: true, 
			xfbml: true,
			oauth : true,
			channelUrl : 'http://www.playem.org/channel.html'
		});
		cb();
	};
	var e = document.createElement('script');
	e.src = document.location.protocol + '//connect.facebook.net/en_US/sdk.js';
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
	function provideCallback(cb2){
		return function(){
			if (typeof cb2 == "function")
				cb2.apply(null, arguments);
			if (!--remaining)
				cb();
		}
	}
	return function(cb2){
		++remaining;
		return provideCallback(cb2);
	}
};

function keepLettersOnly(str) {
	return (""+str).replace(/[^\w]/g, "");
}

function parseHashParams(){
	var params = {}, strings = window.location.href.split(/[#&\?]+/).slice(1);
	for (var i in strings) {
		var splitted = strings[i].split("=");
		params[decodeURIComponent(splitted[0])] = typeof(splitted[1]) == "string" ? decodeURIComponent(splitted[1]) : null;
	}
	return params;
}
