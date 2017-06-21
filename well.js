var system = require('system');
var args = system.args;

if (args.length != 3) {
    console.log("Incorrect command-line args. Usage: phantomjs well.js <username> <password>");
}

var email = args[1];
var password = args[2];

phantom.injectJs('lib/include.js');

console.log("\n===" + email + "===");

resetWatchdog(1000 * 60); //Quit in 60 seconds in case of freezing
login(email, password, mainLoop);

function mainLoop() {
    resetWatchdog(1000 * 60);

    var attributes = getAttributesUnsafe();
    if (attributes.nightmares.total >= 6) {
        loge("Nightmares dangerously high, exiting to prevent issues.");
        exit();
    } else if (attributes.actions.value <= 2) {
        loge("Actions low. Exiting...");
        exit();
    }

    getQualities(function(qualities) {
        var fam = qualities["Fasting and Meditating to a Foolish End"];
        var smen = qualities["Seeking Mr Eaten's Name"];
        if (isNaN(fam)) {
            fam = 0;
        }
        loge("SMEN: " + smen + ", FAM: " + fam + ", actions: " + attributes.actions.value + "/" + attributes.actions.max);

        goToStory(function() {
            clickStorylet('The Well', function() {
                if (fam < 77) {
                    clickStorylet('Prepare', function() {
                        clickStorylet(getStorylets()[0], mainLoop); //TODO CHECK IF THIS WORKS
                    });
                } else if (fam < 100) {
                    clickStorylet('Wait by the well', mainLoop);
                } else if (fam < 462) { //385 (cost if fail to watch the well) + 77, if lower than this you may as well go all out and circle
                    clickStorylet('Circle the well', mainLoop);
                } else if (fam < 1800) { //1800 chosen as a safety margin to allow 3-4 failures
                    clickStorylet('Watch the well', mainLoop);
                } else if (fam >= 10000 && smen > 70) { 
                    clickStorylet('Understand', mainLoop);
                } else if (fam < 60000) { //Bread and butter, grind away here.
                    clickStorylet('Circle the well', mainLoop);
                } else if (fam >= 60000) {
                    clickStorylet('Insight', mainLoop);
                }
            });
        });
    });
}

function prepare() {

}