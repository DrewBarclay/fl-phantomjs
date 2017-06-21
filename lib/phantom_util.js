var page = require('webpage').create();
var fs = require('fs');

phantom.onError = function(msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function + ')' : ''));
        });
    }
    console.error(msgStack.join('\n'));
    phantom.exit(1);
};

function fail(msg){
		console.log("Problem detected.");
		msg && console.log("Message: " + msg);
        phantom.exit();
        //page.render("error" + new Date().getTime() + ".png");
}

page.onError = function(msg, trace){
	console.log("ERROR: " + msg);
	trace.forEach(function(item) {
	        console.log('  ', item.file, ':', item.line);
	});
	fail();
}

page.onConsoleMessage = function(msg) {
    if (msg != "[object Object]") {
        console.log("EVALUATE: " + msg);
    }
}

function loge(msg) {
    console.log("[" + new Date().toUTCString() + "] " + msg);
}

function exit() {
    loge("Exited.");
    phantom.exit();
}

//Calling resetWatchdog(time in ms) will cause the program to exit if the watchdog timer is not reset before the time given expires.
resetWatchdog = (function() {
    var watchdogTimer = 0;
    return function(time) {
        clearTimeout(watchdogTimer);
        watchdogTimer = setTimeout(function() { loge("Watchdog timer expired."); exit(); }, time);
    }
})();

//Create a state with a unique ID
function createStateSaver(id) {
    var path = "save/" + id;
    var state = {};
    state.load = function(def) {
        if (!fs.exists(path)) {
            return def;
        }

        return JSON.parse(fs.read(path));
    }

    state.save = function(data) {
        fs.write(path, JSON.stringify(data), 'w');
    }

    return state;
}
