
// WATCHDOG
var watchdog;
var watchDogTimer;
// INITIATION
var firstLoad=true;
function onFirstLoad(){
	$("#timeSlider").val(0);
	document.getElementById("timeSlider").style.visibility = 'visible';
	document.getElementById("gauge").style.visibility = 'visible';
	document.getElementById("scaleLabel").style.visibility = 'visible';
}

// CHART
var ctx = document.getElementById("canvas").getContext("2d");
var historyChart = new Chart(ctx);
var chartTimeInterval=3600;
var maxChartSize;
lineChartData = {
	labels : ["label1","label2"],
	datasets : [
		{
			label: "My First dataset",
			fillColor : "rgba(150,150,200,0.3)",
			strokeColor : "rgba(130,130,130,1)",
			pointColor : "rgba(220,220,220,1)",
			pointStrokeColor : "#fff",
			pointHighlightFill : "#fff",
			pointHighlightStroke : "rgba(220,220,220,1)",
			data : [0,0]
		},
	]
}	
var lineChartOptions = {
	responsive: true,
	animation: false,
	bezierCurve : true,
	animationSteps: 20,
	showTooltips: false,
	pointDot : false,
	scaleBeginAtZero: true,
}
var labelInterval = 1;
var skiplabelcount = labelInterval;
function addChartData(data,label){
	if (skiplabelcount==labelInterval){
		skiplabelcount=1;
	}else{
		label="";
		skiplabelcount++;
	}
	window.myLine.addData(data, label);
}
var chartSize = 2;
function chartUpdate(packet){
	chartTimeInterval = packet.chartTimeInterval;
	maxChartSize = packet.maxChartSize;				
	lineChartData.labels = packet.labels;
	lineChartData.datasets[0].data = packet.data;
	/*for(i=0;i<maxChartSize;i++){
		console.log("data["+i+"]= "+packet.data[i]);
	}*/
	window.myLine = historyChart.Line(lineChartData, lineChartOptions);		
	chartSize=packet.data.length;
	if(firstLoad){ 			
		firstLoad=false;
		onFirstLoad();
	}
}	

// RANGE SLIDER
var sliderPosition = 0;
var interval;
var sliderValues = [1,15,60,900,3600];
var sliderLables = [
	"24 hours",
	"6 hours",
	"24 minutes",
	"6 minutes",
	"24 seconds"
];
var sliderChanged, sliderInput;

// STATUS ICON
var greenIcon= new Image();
greenIcon.src="images/green.png";
var redIcon= new Image();
redIcon.src="images/red.png";
var statusIconG = document.getElementById('statusIconG');
var statusIconR = document.getElementById('statusIconR');

// WEBSOCKET
var socket = io.connect();
// CONNECTION STATUS
var connected = false;
function updateConnectionStatus(newStatus){
	if(connected != newStatus){
		connected = newStatus;
		if(connected){
			$("#status").text("Connected");
			statusIconG.style.visibility = 'visible';
			statusIconR.style.visibility = 'hidden';
			sliderChanged(sliderPosition);
			
		}else{
			$("#status").text("Disconnected");
			statusIconR.style.visibility = 'visible';
			statusIconG.style.visibility = 'hidden';
		}		
	}
}
socket.on('connect', function(){
	updateConnectionStatus(true);
});

socket.on('disconnect', function(){
	updateConnectionStatus(false);
});	

socket.on('chartUpdate',chartUpdate);		

var Packet = function (msg) {
	this.sender = "me";
};		

socket.on('statusUpdate', function(packet){
	updateConnectionStatus(true);
	watchdog();
	$('#status-box').html(
		"<center>Server Time = "+packet.time+
		",	Power = "+packet.power+"W");

	Tgauge.setValue(packet.power);
	if (firstLoad){return};
	if(packet.secondsToday % chartTimeInterval == 0){
		addChartData([packet.average], packet.label);
		chartSize++;
	}
	if (chartSize>maxChartSize){
		window.myLine.removeData();
		chartSize--;
	}
});
// SWITCH FUNCTIONS
function changeSwitchState(state){
	if(state){
		switchImage.style.backgroundPosition="-25px -15px"
		console.log("switching on");
	}else{
		console.log("switching off");
		switchImage.style.backgroundPosition="-107px -15px"
	}
	switchIsOn = state;
}

var switchImage = document.getElementById('switchImage');
var switchIsOn = true;
var switchAvailable = true;
function switchClick(){
	if (switchAvailable){
		switchAvailable = false;
		setTimeout(function(){switchAvailable=true},1000);
		changeSwitchState(!switchIsOn);
		socket.emit('changePowerSwitch', switchIsOn);
	}
}
socket.on('actualPowerState', function(actualPowerState){
	changeSwitchState(actualPowerState)
});

// SLIDER FUNCTIONS
sliderChanged = function(value){
	console.log('sending interval = '+value);
	sliderInput(value);
	socket.emit('interval', interval);
}
sliderInput = function(value){
	sliderPosition = value;
	document.getElementById("scaleLabel").innerHTML = sliderLables[value];
	interval = sliderValues[sliderValues.length-value-1];
}
setInterval(function(){
	socket.emit('heartbeat');
},10000);
// WATCHDOG
function watchdog(){
	clearTimeout(watchDogTimer);
	watchDogTimer = setTimeout(function(){
		updateConnectionStatus(false);
		socket.disconnect();
		socket.io.reconnect()
		watchdog();
	}, 5000);
}
