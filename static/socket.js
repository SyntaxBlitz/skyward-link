(
	function () {
		var slugDataXMLHttpRequest = new XMLHttpRequest();
		slugDataXMLHttpRequest.withCredentials = true;	// sends cookies along, which is kind of the point
		slugDataXMLHttpRequest.open("get", "https://skyward.link/slug-data");

		var socketIOScriptElement = document.createElement("script");
		socketIOScriptElement.src = "https://cdn.socket.io/socket.io-1.3.4.js";

		var loadedParts = 0;
		var numParts = 2;

		var skywardLinkCookies;

		slugDataXMLHttpRequest.onload = function () {	// TODO: check for 404/error
			skywardLinkCookies = this.responseText;
			loadedParts++;
			if (loadedParts == numParts)
				initialiseSocket();
		}

		socketIOScriptElement.onload = function () {
			loadedParts++;
			if (loadedParts == numParts)
				initialiseSocket();
		};

		slugDataXMLHttpRequest.send();
		document.body.appendChild(socketIOScriptElement);

		var initialiseSocket = function () {
			var socket = io('https://skyward.link', {secure: true});

			var slug = skywardLinkCookies.match(/slug=([A-Za-z]+)/)[1];
			var code = skywardLinkCookies.match(/code=(0\.\d+)/)[1];

			socket.on("connect", function () {
				socket.emit("presenter connected", {slug: slug, code: code});
			});

			socket.on("keypress", function (data) {
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