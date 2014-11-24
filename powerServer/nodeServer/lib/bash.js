var date_time = require("./date_time");
function log(message){
	console.log(date_time.getlocalTime() + "  " + message);
}

var spawnCommand = require('spawn-command');

exports.exec = function(command){
    var child = spawnCommand(command);

	child.stdout.on('data', function (data) {
		var message = String(data)
		message = message.replace(/(\r\n|\n|\r)/gm,"");
		log(message);
	});

	/*child.on('exit', function (exitCode) {
	  console.log('exit', exitCode);
	});*/
}