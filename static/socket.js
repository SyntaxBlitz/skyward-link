(
	function () {
		var slugDataScriptElement = document.createElement("script");
		slugDataScriptElement.src = "https://skyward.link:6001/slugData";

		var socketIOScriptElement = document.createElement("script");
		socketIOScriptElement.src = "https://cdn.socket.io/socket.io-1.3.4.js";

		var loadedScripts = 0;
		var numScripts = 2;

		slugDataScriptElement.onload = function () {
			loadedScripts++;
			if (loadedScripts == numScripts)
				initialiseSocket();
		}

		socketIOScriptElement.onload = function () {
			loadedScripts++;
			if (loadedScripts == numScripts)
				initialiseSocket();
		};

		document.body.appendChild(slugDataScriptElement);
		document.body.appendChild(socketIOScriptElement);

		var initialiseSocket = function () {
			var socket = io('https://skyward.link:6001', {secure: true});
			console.log(skywardLinkCookies);

			var slug = skywardLinkCookies.match(/slug=([A-Za-z]+)/)[1];
			var code = skywardLinkCookies.match(/code=(0\.\d+)/)[1];

			socket.on("connect", function () {
				socket.emit("presenter connected", {slug: slug, code: code});
			});

			socket.on("keypress", function (data) {
				console.log("keypress :)");
				var ev = document.createEvent("Events");
				ev.initEvent("keydown", true, true);
				ev.keyCode = data;
				document.getElementsByClassName("punch-present-iframe")[0].contentDocument.dispatchEvent(ev);
			});

			var currentlyPresenting = isPresenting();
			document.body.addEventListener("DOMSubtreeModified", function (e) {
				if (isPresenting() !== currentlyPresenting) {
					currentlyPresenting = isPresenting();
					socket.emit("presentation state changed", {slug: slug, code: code, state: currentlyPresenting});
				}
			});
		}

		var isPresenting = function () {
			return document.getElementsByClassName("punch-present-iframe").length !== 0;
		};
	}
)();