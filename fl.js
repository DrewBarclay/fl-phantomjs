var system = require('system');
var args = system.args;

if (args.length != 5) {
    console.log("Incorrect command-line args.");
}

var email = args[1];
var password = args[2];
var buddy = args[3];
var receiver = args[4];

phantom.injectJs('lib/include.js');
phantom.injectJs('util_storylets.js');

console.log("\n===" + email + "===");

resetWatchdog(1000 * 60); //In a minute, exit unless we successfully log in.
login(email, password, mainLoop);

function mainLoop() {
    resetWatchdog(1000 * 60 * 2);
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
    acceptAllMessages(function() { 
        loge("All messages accepted."); 
        mainLoop2(); 
    });
}

function mainLoop2() {
    var attributes = getAttributesUnsafe();
    loge("Attributes: " + JSON.stringify(attributes));

    handleSecondChances(function() {
        handleSuspicion(cardsLoop);
    });
}

function cardsLoop() {
    considerPromenade(function() {
        drawCards(function(cards) {
            loge("Drew cards. Cards: " + JSON.stringify(cards));
            handleCards(cards);
        });
    });
}

function handleCards(cards) {
    var funcMap = { "The Neath's Mysteries": handleNeath, 
                    //"Pass the Cat: a wriggling delivery": handleCat, 
                    "Give a Gift! A commotion in the Square of Lofty Words": handleGift,
                    "A Small Hint": handleHint,
                    "A New Arrival: A Grubby Inquiry": handleGrubby,
                    "A street-cart is selling Fourth City Rags": handleRags,
                    "Exploring Fallen London": handleExploring,
                    "Adopt a Profession": handleAdopt,
                    "A disgraceful spectacle": handleVance,
                    "A Word about Menaces": handleWordMenaces
                  };

    if (cards.hand.length == 0) {
        if (cards.waiting > 0) {
            cardsLoop();
            return;
        } else {
            exit();
            return;
        }
    }

    var card = cards.hand.pop();
    
    if (funcMap[card]) {
        loge("Card with custom behavior found: " + card);
        funcMap[card](function() { handleCards(cards); });
        return;
    } else if (card.indexOf("Surface Ties") > -1) {
        loge("Surface ties card found: " + card);
        clickCard(card, function() {
            clickStorylet(getStorylets()[0], function() {
                handleCards(cards);
            });
        });
        return;
    } else if (card == "A Banner with a Strange Device") {
        handleCards(cards);
        return;
        //Do nothing; manual intervention
    } else {
        loge("Discarding card: " + card);
        discardCard(card, function() { handleCards(cards); });
        return;
    }
}