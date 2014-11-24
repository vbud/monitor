var databaseName = './history.json';
var date_time = require("./date_time");
var bash = require("./bash");

function log(message){
	console.log(date_time.getlocalTime() + "  " + message);
}
var recentValue = 0;
// TCP SOCKET SERVER
var net = require('net');

var HOST = '127.0.0.1';
var PORT = 3490;

var client = new net.Socket();
var tcpSocketConnected = false;
exports.sendMessage = function sendMessage(message){
    // Write a message to the socket as soon as the client is connected, the server will receive it as message from the client 
    //console.log("tcp client: sending  '"+message+"'");
	client.write(message);
}
function pollSocket(){
	if (tcpSocketConnected){
		sendMessage('request');
	}else{
		connectCserver();
	}
}
function connectCserver() {
	client.connect(PORT, HOST, function() {
		tcpSocketConnected = true;
		log('Node server connected to ' + HOST + ':' + PORT);
	});
}
var packet;
var numberData;
client.on('data', function(data) {
	packet = String(data).split(",");
	numberData = Number(packet[2]);
	//log('Node server: received '+packet);
	if (!isNaN(numberData)){
		if (numberData < 0.5){numberData=0};
		recentValue = numberData;
	}	
});
client.on('close', function() {
	tcpSocketConnected = false;
	log('client: Connection closed');
});
client.on('error', function (exc) {
	log("ignoring exception: " + exc);
});

var close = function() {
	//adc.close(); 
	client.destroy();
    log('powerServer terminated');
    process.exit();
}
exports.close = close;
bash.exec("sudo /home/pi/arduino/powerServer/cServer/rf24server");
connectCserver();
/*setTimeout(function(){
	setInterval(pollSocket, 2000);
}, 3000);*/

var history = [];
for(var i=0;i<86400;i++){history[i]=0}
var mostRecentTime;
function writeSensorReading(){
	mostRecentTime = date_time.secondsToday();
	history[mostRecentTime]=recentValue;
	//log('time '+mostRecentTime+' = '+recentValue);
}
setInterval(writeSensorReading, 100);

exports.getHistory = function(){return history};
exports.getMostRecentTime = function(){return mostRecentTime};
exports.getLast = function(){
	return history[mostRecentTime];
}