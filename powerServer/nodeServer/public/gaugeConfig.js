// GAUGE SCRIPT

var ratio = window.devicePixelRatio || 1;
var gaugeSize = document.getElementById('gauge').offsetWidth;
var gaugeResolution = gaugeSize*ratio;

var Tgauge = new Gauge({
	renderTo    : 'gauge',
	width       : gaugeResolution,
	height      : gaugeResolution,
	glow        : true,
	units       : 'W',
	title       : '',
	minValue    : 0,
	maxValue    : 2000,
	majorTicks  : ['0','250','500','750','1000','1250','1500','1750','2000'],
	minorTicks  : 5,
	strokeTicks : true,
	valueFormat : { int : 3, dec : 0 },
	highlights  : [
		/*{ from : 30, to : 45, color : 'rgba(0,128, 255, .5)' },
		{ from : 45, to : 85, color : 'rgba(255,255, 0, .4)' },
		{ from : 85, to : 100, color : 'rgba(255, 0, 0, .5)' }*/
	],
	colors      : {
		plate      : '#fff',
		majorTicks : '#000',
		minorTicks : '#222',
		title      : '#222',
		units      : '#666',
		numbers    : '#000',
		needle     : { start : 'rgba(0, 0, 0, 1)', end : 'rgba(0, 0, 0, 0.5)' }
	},
	animation : {
		delay : 10,
		duration: 500,
		fn : 'linear'
	}
});

Tgauge.draw();








//canvas.style.width=(targetPageWidth*0.7)+"px";//actual width of canvas
//canvas.style.height=(targetPageWidth*0.7)+"px";//actual height of canvas*/


/*
canvas.width = 600;
canvas.height = 600;
document.body.offsetWidth
document.body.offsetHeight*/
/*
var canvas = document.getElementById('gauge');
/*canvas.width=document.body.offsetWidth;//horizontal resolution (?) - increase for better looking text
canvas.height=document.body.offsetHeight;//vertical resolution (?) - increase for better looking text*//*
canvas.style.width=1000;//actual width of canvas
canvas.style.height=1000;//actual height of canvas*/


/*
var canvas = document.getElementById('gauge'),
	context = canvas.getContext('2d').webkitBackingStorePixelRatio,
	devicePixelRatio = window.devicePixelRatio || 1,
	backingStoreRatio = context.webkitBackingStorePixelRatio ||
						context.mozBackingStorePixelRatio ||
						context.msBackingStorePixelRatio ||
						context.oBackingStorePixelRatio ||
						context.backingStorePixelRatio || 1,

	ratio = devicePixelRatio / backingStoreRatio;

var oldWidth = canvas.width;
var oldHeight = canvas.height;

canvas.width = oldWidth * ratio;
canvas.height = oldHeight * ratio;

canvas.style.width = oldWidth + 'px';
canvas.style.height = oldHeight + 'px';

// now scale the context to counter
// the fact that we've manually scaled
// our canvas element
context.scale(5, 5);
/*
//var canvas = document.getElementById('gauge');
var canvas = $('#gauge');
var context = canvas.getContext('2d').webkitBackingStorePixelRatio;
//var context = canvas.getContext('2d');
// Find upscale ratio: //
var ratio = 1;
//if(context.webkitBackingStorePixelRatio < 2)
//{
// default to 1 if property not set //
ratio = window.devicePixelRatio || 1;
log("ratio="+ratio);
//};

// resize canvas' logical size (ensure CSS maintains original size)//
var w = context.canvas.width;
var h = context.canvas.height;
canvas.attr('width', w*ratio);
canvas.attr('height', h*ratio);*/
  
//context.scale(window.devicePixelRatio, window.devicePixelRatio);
/*var hidefCanvas = document.getElementById('gauge');;
var hidefContext = hidefCanvas.getContext('2d');
 
if (window.devicePixelRatio) {
var hidefCanvasWidth = $(hidefCanvas).attr('width');
var hidefCanvasHeight = $(hidefCanvas).attr('height');
var hidefCanvasCssWidth = hidefCanvasWidth;
var hidefCanvasCssHeight = hidefCanvasHeight;
$(hidefCanvas).attr('width', hidefCanvasWidth * window.devicePixelRatio);
$(hidefCanvas).attr('height', hidefCanvasHeight * window.devicePixelRatio);
$(hidefCanvas).css('width', hidefCanvasCssWidth);
$(hidefCanvas).css('height', hidefCanvasCssHeight);
hidefContext.scale(window.devicePixelRatio, window.devicePixelRatio);
}*/