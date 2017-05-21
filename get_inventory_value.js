var system = require('system');
var args = system.args;

if (args.length != 3) {
    console.log("Incorrect command-line args.");
}

var email = args[1];
var password = args[2];

phantom.injectJs('lib/include.js');

resetWatchdog(1000 * 60); //In a minute, exit unless we successfully log in.
login(email, password, mainLoop);

function mainLoop() {
    resetWatchdog(1000 * 60 * 6);
    getSellableInventory(function(inventory) {
        var total = 0;
        for (var i = 0; i < inventory.length; i++) {
            total += inventory[i].quantity * inventory[i].sellPrice;
            console.log(inventory[i].name + ": " + (inventory[i].quantity * inventory[i].sellPrice) + " echoes");
        }
        console.log(total);
        phantom.exit();
    });
}