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
		slugMatches[slug.toLowerCase()] = {
			url: data,
			code: null,
			clickerSocket: socket,
			presenterSocket: null
		};

		callback(slug);	// display it with normal case, even though we store it in lowercase
	});

	socket.on("click", function (data) {
		if (!data.slug)
			return;
		var slug = data.slug.toLowerCase();
		if (slugMatches[slug] !== undefined && slugMatches[slug].clickerSocket === socket) {	// make sure the correct person is sending this message
			var keyCode;
			if (data.action === "back") {
				keyCode = 37;
			} else if (data.action === "next") {
				keyCode = 39;
			}

			slugMatches[slug].presenterSocket.emit("keypress", keyCode);
		}
	});

	// PRESENTER EVENTS
	socket.on("presenter connected", function (data) {
		var slug = data.slug.toLowerCase();
		if (slugMatches[slug] !== undefined && slugMatches[slug].code === data.code) { // awesome authentication man. I wonder if there are computer security conferences where I can show this shit off
			slugMatches[slug].presenterSocket = socket;
		}
	});

	socket.on("presentation state changed", function (data) {
		var slug = data.slug.toLowerCase();
		if (slugMatches[slug] !== undefined && slugMatches[slug].code === data.code) {
			slugMatches[slug].clickerSocket.emit("presentation state changed", data.state);
		}
	});
});

function retrievalHandler(request, response) {
	var headers = {
		"Access-Control-Allow-Origin": "https://skyward.link"
	};

	if (request.url.substring(0, 9) == "/get-url?") {
		var bits = request.url.substring(9).split("&");
		if (bits[0].substring(0, 5) == "slug=" && bits[1].substring(0, 5) == "code=") {
			var slug = bits[0].substring(5).toLowerCase();
			var code = bits[1].substring(5);

			if (slugMatches[slug] !== undefined && slugMatches[slug].code == null) { // the slug is entered but hasn't yet connected with a client
				slugMatches[slug].code = code;
			
				response.writeHead(200, headers);
				response.end(slugMatches[slug].url);
			} else {
				response.writeHead(409, headers);
				response.end("already requested");				
			}
		} else {
			response.writeHead(401, headers);
			response.end("malformed request");
		}
	} else if (request.url == "/slug-data") {
		response.writeHead(200, {
			"Access-Control-Allow-Origin": "https://docs.google.com",
			"Access-Control-Allow-Credentials": "true",	// I should hope so
			"Content-Type": "text/plain"
		});
		response.end(request.headers.cookie);
	} else {	// server config should only allow this if they request /get-url with no parameters
		response.writeHead(401, headers);
		response.end("malformed request");
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
		"Perfect",
		"Quirky",
		"Regal",
		"Round",
		"Shiny",
		"Terrific",
		"Unique",
		"Vibrant",
		"Wonderful",
		"Wise",


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
		"Flutes",
		"Gardens",
		"Glitter",
		"Grapes",
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
		"Oranges",
		"Potatoes",
		"Pickles",
		"People",
		"Queens",
		"Rainforests",
		"Rabbits",
		"Sharks",
		"Snails",
		"Turkeys",
		"Tacos",
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
