function handleSuspicion(callback) {
    var attributes = getAttributesUnsafe();
    if (attributes.suspicion.total >= 3) {
        goToStory(function() {
            clickStorylet('Attend to Matters of Shadows and Suspicion', function() {
                clickStorylet('Ask a friend to cover for you', function() {
                    choosePlayer(buddy, function() {
                        loge(buddy + " invited to help with suspicion.");
                        callback();
                    });
                });
            });
        });
    } else {
        callback();
    }
}

//Do not call this directly
function handleSecondChancesR(stats, callback) {
    if (stats.length == 0) {
        callback();
        return;
    }

    var stat = stats.pop(); //todo this pattern of popping comes up everywhere write an abstraction function

    if (stat.chances < 2) {
        //Send a request!
        goToStory(function() { 
            stat.inviteFunc(function() { 
                handleSecondChancesR(stats, callback);
            }); 
        });
    } else {
        handleSecondChancesR(stats, callback);
    }
}

function handleSecondChances(callback) {
    var attributes = getAttributesUnsafe();

    //Now check pending... 
    var stats = [   {chances: attributes.persuasive.secondChances, inviteFunc: inviteCoffee}, 
                    {chances: attributes.watchful.secondChances, inviteFunc: inviteChess}, 
                    {chances: attributes.dangerous.secondChances, inviteFunc: inviteSpar}, 
                    {chances: attributes.shadowy.secondChances, inviteFunc: inviteLoiter}
                ];

    handleSecondChancesR(stats, callback);
}

//The Alleys of Spite 
//The Pickpocket's Promenade!
//goToStory - hit onwards actually
//The Tenterhooks
//goToStory
function considerPromenade(callback) {
    var attributes = getAttributesUnsafe();
    getCards(function(cards) {
        if (attributes.suspicion.total < 3 && attributes.actions.value > 16 && cards.waiting <= 2 && cards.waiting >= 1) {
            //Let's go for a promenade and refresh our opportunity cards!
            loge("Going to pickpocket to refresh cards.");
            travelTo('Spite', function() {
                clickStorylet('The Alleys of Spite', function() {
                    clickStorylet("The Pickpocket's Promenade!", function() {
                        goToStorySimple(function() {
                            clickStorylet('The Tenterhooks', function() {
                                loge("Entered the promenade.");
                                handlePromenade(callback);
                            });
                        });
                    });
                });
            });
        } else {
            callback();
        }
    });
}

//Stop and consider
//Loiter
//repeat until one of the storylets is
//Your notoriety is limited
//Click the [0] storylet
//goToStory
//Dispose of your Pickpocket's Trophies
//Finished!
function handlePromenade(callback) {
    goToStory(function() {
        var storylets = getStorylets();
        if (storylets.indexOf("Stop and consider") > -1) {
            loge("Loitering...");
            clickStorylet("Stop and consider", function() {
                clickStorylet("Loiter", function() { handlePromenade(callback) });
            });
            return;
        }

        if (storylets.indexOf("Your notoriety is limited") > -1) {
            loge("Now seen!");
            clickStorylet(storylets[0], function() { handlePromenade(callback) }); //Not necessarily the notoriety option.
            return;
        }

        if (storylets.indexOf("Dispose of your Pickpocket's Trophies") > -1) {
            loge("Disposing of trophies...");
            clickStorylet("Dispose of your Pickpocket's Trophies", function() {
                loge("Finishing up pickpocketing...");
                clickStorylet("Finished!", function() {
                    loge("Finished pickpocketing.");
                    callback();
                });
            });
            return;
        }
    });
}

function inviteCoffee(callback) {
    clickStorylet('Attend to Matters of Persuasion and Scandal', function() {
        clickStorylet("Meet someone for a Coffee at Caligula's", function() {
            choosePlayer(buddy, function() {
                loge(buddy + " invited for coffee!");
                callback();
            });
        });
    });
}

function inviteChess(callback) {
    clickStorylet('Attend to Matters of Watchfulness and Nightmares', function() {
        clickStorylet('Invite someone to a Game of Chess', function() {
            choosePlayer(buddy, function() {
                loge(buddy + " invited for chess!");
                callback();
            });
        });
    });
}

function inviteSpar(callback) {
    clickStorylet('Attend to Matters of Danger and Wounds', function() {
        clickStorylet('Invite someone to a Sparring Bout', function() {
            choosePlayer(buddy, function() {
                loge(buddy + " invited for sparring!");
                callback();
            });
        });
    });
}

function inviteLoiter(callback) {
    clickStorylet('Attend to Matters of Shadows and Suspicion', function() {
        clickStorylet('Invite someone to a spot of Suspicious Loitering', function() {
            choosePlayer(buddy, function() {
                loge(buddy + " invited for loitering!");
                callback();
            });
        });
    });
}

function everyStone(callback) {
    clickStorylet('Attend to Matters of Watchfulness and Nightmares', function() {
        clickStorylet('Every stone', callback);
    });
}

function handleNeath(callback) {
    clickCard("The Neath's Mysteries", function() {
        clickStorylet('A strange sort of prank', function() {
            choosePlayer(receiver, callback)
        })
    });
}

function handleCat(callback) {
    clickCard('Pass the Cat: a wriggling delivery', function() {
        clickStorylet("Accept the delivery", function() {
            clickInventoryItem('A Boxed Cat?', function() {
                clickStorylet('Pass it on!', function() {
                    choosePlayer(receiver, callback);
                });
            });
        });
    });
}

function handleGift(callback) {
    var attributes = getAttributesUnsafe();
    if (attributes.watchful.secondChances >= 2 && attributes.shadowy.secondChances >= 2 && attributes.dangerous.secondChances >= 2 && attributes.persuasive.secondChances >= 2) {
        clickCard("Give a Gift! A commotion in the Square of Lofty Words", function() {
            clickStorylet('The gift of admiration', function() {
                choosePlayer(receiver, callback);
            });
        });
    } else {
        loge("Not enough second chances to use gift!");
        callback();
    }
}

function handleHint(callback) {
    clickCard("A Small Hint", function() {
        clickStorylet('But first, retrieve a concealed treasure', callback);
    });
}

function handleRags(callback) {
    clickCard("A street-cart is selling Fourth City Rags", function() {
        clickStorylet("Purchase Fourth City Rags", callback);
    });
}

function handleGrubby(callback) {
    clickCard("A New Arrival: A Grubby Inquiry", function() {
        clickStorylet('"Your question is unnecessary."', callback);
    });
}

function handleExploring(callback) {
    clickCard("Exploring Fallen London", function() {
        clickStorylet("Learn the way to another part of the city", callback);
    });
}

function handleAdopt(callback) {
    clickCard("Adopt a Profession", function() {
        var storylets = getStorylets();
        clickStorylet(storylets[0], callback);
    });
}

function handleVance(callback) {
    clickCard("A disgraceful spectacle", function() {
        clickStorylet('Snatch a stone', callback);
    });
}

function handleWordMenaces(callback) {
    clickCard("A Word about Menaces", function() {
        var storylets = getStorylets();
        clickStorylet(storylets[0], callback);
    });
}