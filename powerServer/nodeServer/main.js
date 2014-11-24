var buttonLights = require("./lib/buttonLights"),
	httpServer = require("./lib/httpServer"),
	date_time = require("./lib/date_time"),
	bash = require("./lib/bash"),
	recorder = require("./lib/recorder"),
	websocket = require("./lib/websocket");
	
function log(message){
	console.log(date_time.getlocalTime() + "  " + message);
}

function exit(){
	//console.log('\n');
	log('\nServer has safely shutdown.');
	process.exit();
}

process.on('SIGINT', exit);
// START UP
var server = httpServer.start();
websocket.createCommandSocket(server);


