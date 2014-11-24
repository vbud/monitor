// date and time functions
var time = require('time');
var zone = "America/Los_Angeles";

exports.getlocalTime = function() {
	var date = new time.Date();
	date.setTimezone(zone);	
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
	
	//var zoneAbrr = date.getTimezoneAbbr();

    //return hour + ":" + min + ":" + sec + " " + zoneAbrr;
	return hour + ":" + min + ":" + sec;

}
exports.getZone = function(){
	var date = new time.Date();
	date.setTimezone(zone);
	return	date.getTimezoneAbbr();
}

exports.secondsToTime = function(s,chartTimeInterval){
	var hour = Math.floor(s/3600);
	var min = Math.floor((s - hour*3600)/60);
	var sec = Math.floor(s - hour*3600 - min*60);
	//console.log("secondsToTime: s="+s+", hour="+hour+", min="+min+", sec="+sec);
	hour = (hour < 10 ? "0" : "") + hour;
	min = (min < 10 ? "0" : "") + min;
	sec = (sec < 10 ? "0" : "") + sec;
	var retval;
	if (chartTimeInterval < 60 ){
		retval = hour + ":" + min + ":" + sec;
	}else{
		retval = hour + ":" + min;
	}	
	//console.log("secondsToTime: s="+s+", hour="+hour+", min="+min+", sec="+sec);
	return retval;
}

exports.time = function(){
	return time.time();
}
exports.getHours = function(){
	var date = new time.Date();
	return date.getHours();
}
exports.getMinutes = function(){
	var date = new time.Date();
	return date.getMinutes();
}
exports.getSeconds = function(){
	var date = new time.Date();
	return date.getSeconds();
}
exports.secondsToday = function(){
	var date = new time.Date();
	date.setTimezone("America/Los_Angeles");
	return ((3600*date.getHours()) + (60*date.getMinutes()) + (date.getSeconds()));
}
