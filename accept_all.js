var system = require('system');
var args = system.args;

if (args.length != 4) {
    console.log("Incorrect command-line args.");
}

var email = args[1];
var password = args[2];
var minActions = args[3];

phantom.injectJs('lib/include.js');

console.log("\n===" + email + "===");

resetWatchdog(1000 * 60);
login(email, password, mainLoop);

function mainLoop() {
    resetWatchdog(1000 * 60 * 6);
    loge("Main loop.");
    goToStory(function() { //To ensure a refresh
        getMessagesToYou(function(messages) {
            loge("Number of messages yet to be accepted: " + messages.length);
            var numToAccept = getAttributesUnsafe().actions.value - minActions;
            acceptNMessages(numToAccept, function() {
                loge("" + numToAccept + " messages accepted.");
                exit();
            });
        });
    });
}