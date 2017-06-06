var system = require('system');
var args = system.args;

if (args.length != 4) {
    console.log("Incorrect command-line args.");
}

var email = args[1];
var password = args[2];
var buddy = args[3];

phantom.injectJs('lib/include.js');
phantom.injectJs('util_storylets.js');

console.log("\n===" + email + "===");

resetWatchdog(1000 * 60); //In a minute, exit unless we successfully log in.
login(email, password, mainLoop);

function mainLoop() {
    resetWatchdog(1000 * 60);
    loge("Main loop.");
    loge("Current Location: " + getLocation());

    if (getLocation() == "The Crowds of Spite") {
        loge("Pickpocketing...");
        handlePromenade(mainLoop);
        return;
    }

    if (getLocation() != "your Lodgings") {
        loge("Not in lodgings, moving to lodgings...");
        travelTo('your Lodgings', function() {
            mainLoop();
        });
        return;
    }

    var attributes = getAttributesUnsafe();
    getMessagesToYou(function(messages) {
        var pending = messages.filter(function(msg) {
            return msg.indexOf("would like you to tell the Constables that they were somewhere else on the night in question") > -1;
        }).length;

        if (attributes.suspicion.cp + pending < 36) {
            acceptAllMessages(function() { loge("All messages accepted."); mainLoop2(); });
        } else {
            loge("Messages NOT accepted; suspicion too high.");
            mainLoop2();
        }
    });
}

function mainLoop2() {
    getMessagesFromYou(function(messages) {
        getCards(function(cards) {
            var attributes = getAttributesUnsafe();

            if (handleSuspicion(cards, messages, attributes, mainLoop)) {
                return;
            }

            if (attributes.watchful.baseValue >= 30) {
                loge("Watchful already at 30!");
                exit();
            }

            if (attributes.watchful.secondChances > 5) {
                upWatchful(attributes.watchful.secondChances, function() { loge("Results: " + getResults()); exit(); });
            } else {
                inviteChess(function() { 
                    goToStory(function() {
                        inviteChess(function() { 
                            goToStory(function() {
                                inviteChess(exit); 
                            });
                        }); 
                    });
                });
            }
        });
    });
}

function upWatchful(chances, callback) {
    if (chances > 5) {
        everyStone(function() {
            upWatchful(chances - 5, callback);
        });
    } else {
        callback();
    }
}