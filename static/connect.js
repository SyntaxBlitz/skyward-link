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
	var code = Math.random(); // technically this is for "security" so I should be using more secure random values but bugger off, I'm enjoying myself here

	var xmlHttpRequest = new XMLHttpRequest();
	xmlHttpRequest.onload = function() {	// TODO: don't use onload here. it doesn't work with 404s.
		if (this.status == 200) {
			document.getElementById("directions").style.display = "block";

			document.cookie = "slug=" + slug + "; domain=.skyward.link; secure";	// XSS prevented above with alphabetic regex
			document.cookie = "code=" + code + "; domain=.skyward.link; secure";

			presentationLink.href = this.responseText;
		} else {
			console.log("error :(");
		}
	};
	xmlHttpRequest.open("get", "https://skyward.link:6001/getUrl?slug=" + slug + "&code=" + code);
	xmlHttpRequest.send();
}