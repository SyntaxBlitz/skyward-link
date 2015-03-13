var CLIENT_ID = "114074408716-tbmjran7j1hk8th4ljg94sb79qlmktid.apps.googleusercontent.com";
var SCOPES = [
	"https://www.googleapis.com/auth/drive"	// cannot otherwise update file permissions if they're not good enough, an important usability feature
];

var loadedPresentations = [];

var handleClientLoad = function () {
	console.log("client load being handled");
	authorize(true);
};

var handleConnectLinkClick = function () {
	console.log("connect link clicked");
	document.getElementById("error").style.display = "none";
	authorize(false);
};

var authorize = function (immediate) {
	gapi.auth.authorize(
		{
			"client_id": CLIENT_ID,
			"scope": SCOPES.join(" "),
			"immediate": immediate
		},
		handleAuthResult
	);
}

var handleAuthResult = function (authResult) {
	console.log(authResult);
	document.getElementById("loaderGif").style.display = "none";
	if (authResult) {
		if (authResult.error && authResult.error !== "") {
			if (authResult.error === "immediate_failed") {
				console.log("Auth was not already set by user. Waiting for the button press.");
			} else if (authResult.error === "access_denied") {
				console.log("The user denied access! The nerve of that dude.");
				var errorDiv = document.getElementById("error");
				errorDiv.innerText = "Could not connect: permissions were not granted.";	// TODO: explain why we need these permissions with a link
				errorDiv.style.display = "block";
			}
		} else {
			console.log("Successful authorization");
			document.getElementById("connectLinkDiv").style.display = "none";

			loadClient(loadFileList);
		}
	}
};

var loadClient = function (callback) {
	gapi.client.load("drive", "v2", callback);
};

var loadFileList = function () {
	var initialRequest = gapi.client.drive.files.list({
		fields: "items(alternateLink,title,permissions,id)",
		trashed: false,
		maxResults: 10,
		q: "mimeType = 'application/vnd.google-apps.presentation'"
	});
	initialRequest.execute(function (response) {
		presentationLoadCallback(response.items);
	});
};

var presentationLoadCallback = function (presentations) {
	var presentationList = document.getElementById("presentationList");
	for (var i = 0; i < presentations.length; i++) {
		var thisPresentation = {
			"id": presentations[i].id,
			"title": presentations[i].title,
			"link": presentations[i].alternateLink,
			"viewable": canAnyoneWithLinkRead(presentations[i])
		};
		loadedPresentations.push(thisPresentation);

		var thisLi = document.createElement("li");
		var thisLink = document.createElement("a");
		thisLink.innerText = thisPresentation.title;
		thisLink.href = "#";
		(function (presentation) {	// god I love closures
			thisLink.onclick = function () {
				presentationClicked(presentation);
			}
		})(thisPresentation);

		if (i === 0) {
			thisLi.className += " first";
		}

		if (!thisPresentation.viewable) {
			thisLi.className += " disabled";
		}

		thisLi.appendChild(thisLink);

		presentationList.appendChild(thisLi);
	}
};

var canAnyoneWithLinkRead = function (presentation) {
	for (var i = 0; i < presentation.permissions.length; i++) {
		if (presentation.permissions[i].id == "anyoneWithLink") {
			return true;	// as long as the permission exists, it's legit. role=reader is the base permission, there's no way to have a permission where we don't get what we need.
		}
	}
	return false;
};

var presentationClicked = function (presentation) {
	if (presentation.viewable) {
		connectPresentation(presentation);
	} else {
		var allowedToChange = confirm("To view the presentation, it needs to have its \"Anyone with link can view\" permission set. I can set it for you now. Do you want me to do that?");
		if (allowedToChange) {
			gapi.client.drive.permissions.insert({
				"fileId": presentation.id,
				"resource": {
					"role": "reader",
					"type": "anyone",
					"withLink": true
				}
			}).execute(function () {
				connectPresentation(presentation);
			});
		} else {
			alert("Ok. You can't present that presentation, then.");
		}
	}
};

var socket;

var connectPresentation = function (presentation) {
	var url = presentation.link;
	var slug;

	socket = io("https://skyward.link", {secure: true});
	socket.on("connect", function () {
		socket.emit("clicker connected", url, function (response) {
			showSlug(response);
			slug = response;
		});
	});

	socket.on("presentation state changed", function (isPresenting) {
		if (isPresenting) {
			document.getElementById("slugView").style.display = "none";
			document.getElementById("clickerControls").style.display = "block";
		} else {
			document.getElementById("clickerControls").style.display = "none";
		}
	});

	document.getElementById("backButton").onclick = function () {
		socket.emit("click", {action: "back", slug: slug});
	};

	document.getElementById("nextButton").onclick = function () {
		socket.emit("click", {action: "next", slug: slug});
	};
};

var showSlug = function (slug) {
	document.getElementById("driveViewContainer").style.display = "none";
	document.getElementById("skywardIntro").style.display = "none";
	document.getElementById("mobileHeader").style.display = "none";

	document.getElementById("slug").innerHTML = "skyward.link/" + slug;

	document.getElementById("slugView").style.display = "block";
};

window.onload = function () {
	var connectLink = document.getElementById("connectLink");
	connectLink.onclick = handleConnectLinkClick;

	var expandedHeader = false;
	document.getElementById("mobileHeader").onclick = function () {
		if (expandedHeader) {
			document.getElementById("skywardIntro").style.left = "-640px";
			document.getElementById("driveViewContainer").style.display = "block";
			document.getElementById("expandButton").src = "https://static.skyward.link/images/ic_expand_more_black_18dp.png";
		} else {
			document.getElementById("skywardIntro").style.left = "0";
			document.getElementById("driveViewContainer").style.display = "none";
			document.getElementById("expandButton").src = "https://static.skyward.link/images/ic_expand_less_black_18dp.png";
		}

		expandedHeader = !expandedHeader;
	};
};