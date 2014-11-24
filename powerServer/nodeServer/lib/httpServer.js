var date_time = require("./date_time"),
	util    = require("util"), 
    path   = require("path"),
    fs     = require("fs");
	
function log(message){
	console.log(date_time.getlocalTime() + "  " + message);
}
log("Node server has started.");
// Web Server Functions
function load_static_file(uri, response) {
	var filename = path.join(process.cwd() + "/public/", uri);
	fs.exists(filename, function(exists) {
		if (!exists) {
			util.puts("404 Error, file: " + filename + " does not exist");
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.end("Sorry, no such URL exists. - webserver.js\n");
			return;
		}
		fs.readFile(filename, "binary", function(err, file) {
			if(err) {
				if(filename.slice(-3)==".js"){
					response.writeHead(500, {"Content-Type": "application/javascript"});
				}
				else{
					response.writeHead(500, {"Content-Type": "text/plain"});
				}
				response.end(err + "\n");
				return;
			}

			response.writeHead(200);
			response.end(file, "binary");
		});
	});
}
//
var	url = require("url");
function onRequest(request, response) {
	var pathname = url.parse(request.url).pathname;
	var query = url.parse(request.url, true).query;
	if(pathname=="/"){
		load_static_file("index.html", response);
	}
	else {	
		load_static_file(pathname, response);
	} 
}
var port = process.env.PORT || 8887;
var server = require('http').createServer(onRequest);
//var commandSocket = require("./commandSocket");
exports.start = function(){
	server.listen(port, function () {
	  log('Node server listening at port ' + port);
	});
	//commandSocket.createCommandSocket(server);
	return server;
}
