var date_time = require("./date_time"),
	recorder = require("./recorder");
	
function log(message){
	console.log(date_time.getlocalTime() + "  " + message);
}

var Packet = function (msg) {
	this.sender = "";
	this.content = msg;
	this.power = 0;
	this.labels=[];
	this.data=[];
};
function getPeriodAverage(history,historyIndex,chartTimeInterval,mostRecentTime){
	var start = historyIndex - chartTimeInterval + 1;
	var sum = 0;
	
	for (var i = 0; i < chartTimeInterval; i++) {
		sum += history[historyIndex];
		historyIndex--;
		if (historyIndex<0){ historyIndex += 86400 };
		// prevent cycling to current time
		if (historyIndex == mostRecentTime){
			historyIndex++;
		}
	}
	var average = sum / chartTimeInterval;
	return average;
}
// CHART
var io;

function statusUpdate(updateTime, socket, chartTimeInterval){
	var packet = new Packet('');
	packet.secondsToday = updateTime;
	packet.time = date_time.secondsToTime(updateTime,0);
	packet.label = date_time.secondsToTime(updateTime,chartTimeInterval);
	var history = recorder.getHistory();
	packet.power = Math.floor(history[updateTime]);
	packet.average = getPeriodAverage(history,updateTime,chartTimeInterval,updateTime);
	//log("packet.power="+packet.power+", packet.average="+packet.average);
	//log('Session '+socket.request.connection.remoteAddress+' update');
	socket.emit('statusUpdate', packet);
}		
function chartInit(socket, chartTimeInterval, maxChartSize){
	var mostRecentTime = recorder.getMostRecentTime();
	
	var history = recorder.getHistory();
	var historyIndex = Math.floor(mostRecentTime / chartTimeInterval) * chartTimeInterval;
	var chartUpdatePacket = new Packet("");

	chartUpdatePacket.chartTimeInterval=chartTimeInterval;
	chartUpdatePacket.maxChartSize=maxChartSize;
	for (var i = maxChartSize-1; i >=0; i--) {
		chartUpdatePacket.labels[i] = date_time.secondsToTime(historyIndex,chartTimeInterval);
		chartUpdatePacket.data[i] = getPeriodAverage(history,historyIndex,chartTimeInterval,mostRecentTime);
		//log("data["+i+"]= "+chartUpdatePacket.data[i]);
		historyIndex = historyIndex - chartTimeInterval;
		if (historyIndex<0){ historyIndex += 86400 };
	}
	socket.emit('chartUpdate',chartUpdatePacket);
}
var actualPowerState = true;
var desiredPowerState = true;
exports.createCommandSocket = function(server) {
	io = require('socket.io')(server);
	var userInfo = {};


	io.sockets.on('connection', function(socket) {
		var remoteAddress = socket.request.connection.remoteAddress;
		log("New socket connection from " + remoteAddress);	
		//INITIATE
		socket.emit('actualPowerState',actualPowerState);
		var chartTimeInterval=3600, maxChartSize=24;
		// BEGIN UPDATES
		var updateTime = date_time.secondsToday();
		var updateTracker = setInterval(function(){
			if (recorder.getMostRecentTime() >= updateTime){
				statusUpdate(updateTime, socket, chartTimeInterval);
				updateTime++;
				if (updateTime==86400){updateTime=0};
			}
		}, 100);

		//HANDLE INCOMMING COMMANDS
		socket.on('message', function(packet) {
			if (!userInfo[remoteAddress]){
				userInfo[remoteAddress]={};
			}
			
			packet.sender=userInfo[remoteAddress]["name"];
			if (!packet.sender){packet.sender=remoteAddress}
			
			log("Sending message \""+packet.content+"\"" + " from " + packet.sender);
			io.sockets.emit('message', packet);
		});
		// WATCHDOG FOR SESSION TIMEOUT
		var sessionTimeout;
		function setSessionTimeout(){
			//log('Session '+remoteAddress+' heartbeat');
			clearTimeout(sessionTimeout);
			sessionTimeout = setTimeout(function(){
				log("Session "+remoteAddress+" is unresponsive");
				socket.disconnect();
			}, 20000); // one minute timeout
		}
		setSessionTimeout();
		socket.on('interval', function(interval){
			chartTimeInterval = interval;
			chartInit(socket, chartTimeInterval, maxChartSize);
		});
		
		// POWER SWITCH
		socket.on('changePowerSwitch', function(switchRequest){
			log('received switch request');
			if(desiredPowerState != switchRequest){
			desiredPowerState = switchRequest;
			actualPowerState = switchRequest;
				if(desiredPowerState){
					recorder.sendMessage('11'); // 11 turns on power
					log('sending 11 to arduino');
				}else{
					recorder.sendMessage('10'); // 10 turns off power
					log('sending 10 to arduino');
				}
				io.sockets.emit('actualPowerState',actualPowerState);
			}
			
		});
		
		socket.on('heartbeat', setSessionTimeout);
		//HANDLE DISCONNECTS
		socket.on('disconnect', function() {
			clearInterval(updateTracker);
			clearTimeout(sessionTimeout);
			log("Session " + remoteAddress + " disconnected");
		});
	});
	return io;
}