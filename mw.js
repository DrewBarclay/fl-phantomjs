var system = require('system');

var args = system.args;

if (args.length != 3) {
    console.log("Incorrect command-line args.");
}

var email = args[1];
var password = args[2];

phantom.injectJs('lib/include.js');

var itemActions = { "Brilliant Soul": "Free the souls in exchange for secrets",
                    "Tale of Terror!!": "Tell your Tales at the fireside", 
                    "Compromising Document": "Confront certain stage performers",
                    "Memory of Light": "Swap tales at the Admiralty", 
                    "Zee-Ztory": "Go drinking with His Amused Lordship", 
                    "Bottle of Strangling Willow Absinthe": "Supply the Royal Bethlehem Hotel with absinthe",
                    "Whisper-Satin Scrap": "Even blackmailers like nice dresses",
                    "Journal of Infamy": "Blackmail a Special Constable",
                    "Correspondence Plaque": "Give your Correspondence Plaques to Surface travellers",
                    "Vision of the Surface": "Speak of far-away places",
                    "Mystery of the Elder Continent": "Speak at a salon on the nature of the Elder Continent",
                    "Scrap of Incendiary Gossip": "Share tall tales with zailors",
                    "Memory of Distant Shores": "Uncover a cache of souls"
                  };
var items = Object.keys(itemActions);

var stateSaver = createStateSaver("mw_" + email);
var itemIndex = stateSaver.load(0);

console.log("\n===" + email + "===");
resetWatchdog(1000 * 60);
login(email, password, mainLoop);

function mainLoop() {
    resetWatchdog(1000 * 60);
    loge("Main loop.");
    var attributes = getAttributesUnsafe();
    if (attributes.actions.value > 5) {
        getInventory(function(inventory) {
            for (;; itemIndex = (itemIndex + 1) % items.length) {
                var item = items[itemIndex];
                if (inventory[item] > 50) {
                    loge("Found " + inventory[item] + " x " + item + ". Converting...")
                    clickInventoryItem(item, function() {
                        clickStorylet(itemActions[item], function() {
                            loge("Converted. Results: ");
                            var results = getResults();
                            for (var i = 0; i < results.length; i++) {
                                console.log("   " + results[i]);
                            }
                            itemIndex = (itemIndex + 1) % items.length;
                            stateSaver.save(itemIndex);
                            mainLoop();
                        });
                    });
                    return;
                }
            }
        });
    } else {
        exit();
    }
}