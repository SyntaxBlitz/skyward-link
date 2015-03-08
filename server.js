var fs = require('fs');
var app = require('https').createServer({
	key: fs.readFileSync("/home/nginx/ssl/key/startssl.skyward.link.key"),
	cert: fs.readFileSync("/home/nginx/ssl/cert/startssl.skyward.link.unified.cert")
}, retrievalHandler);
var io = require('socket.io')(app);

var slugMatches = {};

io.on('connection', function (socket) {
	// CLICKER EVENTS
	socket.on("clicker connected", function (data, callback) {
		var slug = generateSlug();
		slugMatches[slug] = {
			url: data,
			code: null,
			clickerSocket: socket,
			presenterSocket: null
		};

		callback(slug);
	});

	socket.on("click", function (data) {
		if (slugMatches[data.slug] !== undefined && slugMatches[data.slug].clickerSocket === socket) {	// make sure the correct person is sending this message
			var keyCode;
			if (data.action === "back") {
				keyCode = 37;
			} else if (data.action === "next") {
				keyCode = 39;
			}

			slugMatches[data.slug].presenterSocket.emit("keypress", keyCode);
		}
	});

	// PRESENTER EVENTS
	socket.on("presenter connected", function (data) {
		if (slugMatches[data.slug] !== undefined && slugMatches[data.slug].code === data.code) { // awesome authentication man. I wonder if there are computer security conferences where I can show this shit off
			slugMatches[data.slug].presenterSocket = socket;
		}
	});

	socket.on("presentation state changed", function (data) {
		if (slugMatches[data.slug] !== undefined && slugMatches[data.slug].code === data.code) {
			slugMatches[data.slug].clickerSocket.emit("presentation state changed", data.state);
		}
	});
});

function retrievalHandler(request, response) {
	var headers = {
		"Access-Control-Allow-Origin": "https://skyward.link"
	};

	if (request.url.substring(0, 8) == "/getUrl?") {
		var bits = request.url.substring(8).split("&");
		if (bits[0].substring(0, 5) == "slug=" && bits[1].substring(0, 5) == "code=") {
			var slug = bits[0].substring(5);
			var code = bits[1].substring(5);

			if (slugMatches[slug] !== undefined && slugMatches[slug].code == null) { // the slug is entered but hasn't yet connected with a client
				slugMatches[slug].code = code;
			
				response.writeHead(200, headers);
				response.end(slugMatches[slug].url);
			} else {
				response.writeHead(404, headers);
				response.end("404-1");				
			}
		} else {
			response.writeHead(404, headers);
			response.end("404-2");
		}
	} else if (request.url == "/slugData") {
		response.writeHead(200, {
			"Access-Control-Allow-Origin": "https://skyward.link",
			"Content-Type": "text/javascript"
		});
		response.end("var skywardLinkCookies = \"" + request.headers.cookie + "\"");	// potential XSS? I think not, because cookies are supposed to be URL encoded. also, you need to set skywardlink cookies in the first place. and this page is accessed over HTTPS.
	} else {
		response.writeHead(404, headers);
		response.end("404-3");
	}
};

function generateSlug() {
	var adjectives = [
		"Amazing",
		"Awesome",
		"Beautiful",
		"Brilliant",
		"Cheerful",
		"Delightful",
		"Easy",
		"Fabulous",
		"Great",
		"Glittery",
		"Happy",
		"Ideal",
		"Joyful",
		"Kind",
		"Lovely",
		"Magical",
		"Nice",
		"Nifty",
		"Orange",
		"Purple",
		"Peaceful",
		"Quirky",
		"Regal",
		"Shiny",
		"Terrific",
		"Unique",
		"Vibrant",
		"Wonderful",

		"Yummy",
		"Zany"
	];

	var nouns = [
		"Apples",
		"Bananas",
		"Bears",
		"Carrots",
		"Cats",
		"Dogs",
		"Elephants",
		"Fairies",
		"Gardens",
		"Glitter",
		"Houses",
		"Islands",
		"Jackals",
		"Kings",
		"Kangaroos",
		"Lights",
		"Lions",
		"Monkeys",
		"Notes",
		"Olives",
		"Potatoes",
		"Queens",
		"Rainforests",
		"Rabbits",
		"Sharks",
		"Snails",
		"Turkeys",
		"Umbrellas",
		"Vultures",
		"Weddings",

		"Yards",
		"Zebras"
	];

	do {
		var trySlug = adjectives[Math.floor(Math.random() * adjectives.length)] + nouns[Math.floor(Math.random() * nouns.length)];
	} while (slugMatches[trySlug] !== undefined);

	return trySlug;
}

app.listen(6001);
