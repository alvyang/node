var events = require("events");
var event = new events.EventEmitter();

event.on('some_event',function(arg1,arg2){
	console.log("some_evetn事件触发",arg1,arg2);
});
event.on('some_event',function(arg1,arg2){
	console.log("some_evetn2事件触发",arg1,arg2);
});
event.emit("some_event",1,2);
