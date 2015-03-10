window.onload = function () {
	var presentationLink = document.getElementById("presentationLink");
	var newTabTextFontSize = 12;

	presentationLink.onclick = function(e) {
		if (e.button == 0) {
			e.preventDefault();
			e.stopPropagation();

			document.getElementById("newTabText").style.fontSize = ++newTabTextFontSize + "pt"; // :)
		}
	};

	var urlBits = window.location.href.split("/");
	var slug = urlBits[urlBits.length - 1];
		if (slug.match(/[^A-Za-z]/) !== null) {
			return;
			// This won't happen during a normal flow anyway, only if the user accesses with static.skyward.link/connect.html, so we don't need to be polite
		}

	var slugMatch = document.cookie.match(/slug=([A-Za-z]+)/);
	if (slugMatch === null || slugMatch[1].toLowerCase() !== slug) {	// we're trying a new slug, one that isn't already in cookies
		var code = Math.random(); // technically this is for "security" so I should be using more secure random values but bugger off, I'm enjoying myself here

		var xmlHttpRequest = new XMLHttpRequest();
		xmlHttpRequest.onload = function() {	// TODO: don't use onload here. it doesn't work with 404s.
			if (this.status == 200) {
				document.getElementById("directions").style.display = "block";

				document.cookie = "slug=" + slug + "; domain=.skyward.link; secure";	// XSS prevented above with alphabetic regex
				document.cookie = "code=" + code + "; domain=.skyward.link; secure";
				document.cookie = "url=" + escape(this.responseText) + "; domain=.skyward.link; secure";

				presentationLink.href = this.responseText;
			} else {
				console.log("error :(");
			}
		};
		xmlHttpRequest.open("get", "https://skyward.link/get-url?slug=" + slug + "&code=" + code);
		xmlHttpRequest.send();
	} else {	// we already got the URL for this slug, so we don't need to rerequest. TODO: verify that it's the right code, because if we got unlucky and generated the same slug from one we got before a server restart, we'll be sad
		document.getElementById("directions").style.display = "block";
		presentationLink.href = unescape(document.cookie.match(/url=([^;]+)/)[1]);
	}
}