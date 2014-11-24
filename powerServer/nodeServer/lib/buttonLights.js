function log(message){
	console.log(date_time.getlocalTime() + "  " + message);
}
var date_time = require("./date_time");

var bash = require("./bash");
// GPIO
bash.exec("gpio-admin export 17");
bash.exec("gpio-admin export 23");
bash.exec("gpio-admin export 24");
var Gpio = require('onoff').Gpio,
    //led1 = new Gpio(22, 'out'),
	led2 = new Gpio(23, 'out'),
	led3 = new Gpio(24, 'out'),
    button = new Gpio(17, 'in', 'both');

	
// FLASHY LIGHTS
var flashyLightsInterval;
var fPos=0;
function startFlashyLights(){
	clearInterval(flashyLightsInterval);
	fPos=0;
	flashyLightsInterval = setInterval(flashyLights, (200 - fPos*2));
}
function flashyLights(){
	led3.writeSync((fPos % 2));
	//log("flashyLights = "+(fPos % 2));
	fPos++;
	clearInterval(flashyLightsInterval);
	if (fPos<101){
		flashyLightsInterval = setInterval(flashyLights, (200 - fPos*2));
	}
}	
startFlashyLights();
//	
var count=0;	
var lastButtonValue=1;
function onButton(err, value){
	count++;
	lastButtonValue=value;
	led3.writeSync(value^1); // value XOR with 1. Equals 0 for value=1, 1 for value=0.
	if(value==1){
		startFlashyLights();
	}
}
button.watch(onButton);

var holdTime = 0;
function shutdownCheck(){
	if (lastButtonValue^1){
		holdTime++;
	}else{
		holdTime=0;
	}
	if(holdTime==3){
		log("System shutdown requested!");
		led2.writeSync(1);
		setTimeout(function(){
			bash.exec("sudo /sbin/shutdown -h now");
		},2000);
		
	}
}
setInterval(shutdownCheck, 1000);
