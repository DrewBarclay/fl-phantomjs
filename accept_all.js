var system = require('system');
var args = system.args;

if (args.length != 3) {
    console.log("Incorrect command-line args.");
}

var email = args[1];
var password = args[2];

phantom.injectJs('lib/include.js');

console.log("\n===" + email + "===");

resetWatchdog(1000 * 60);
login(email, password, mainLoop);

function mainLoop() {
    resetWatchdog(1000 * 60 * 6);
    loge("Main loop.");
    goToStory(function() { //To ensure a refresh
        acceptAllMessages(function() {
            loge("Messages accepted.");
            exit();
        });
    });
}