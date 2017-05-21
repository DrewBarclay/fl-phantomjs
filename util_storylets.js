function handleSuspicion(cards, messages, attributes, callback) {
    if (attributes.suspicion.total >= 4) {
        var pending = messages.filter(function(msg) {
            return msg.indexOf("a Request for an Alibi") > -1;
        }).length;

        //4 suspicion is 10 cp, each pending is 4 cp removed
        var needed = Math.round((attributes.suspicion.cp - 10.0)/4 + 0.5);
        if (pending < needed) {
            var count = needed - pending;
            loge("Suspicion high, sending " + count + " requests...");
            var requestFunc = function() {
                if (count == 0) {
                    callback();
                    return;
                }

                count--;

                goToStory(function() {
                    clickStorylet('Find a way to throw the Constables off the scent', function() {
                        clickStorylet('Ask a friend to cover for you', function() {
                            choosePlayer(buddy, function() {
                                loge("Request sent.");
                                requestFunc();
                            });
                        });
                    });
                });
            };
            requestFunc();
            return true; 
        }
    }

    return false;
}

function getChances(cards, messages, attributes, callback) {
    //Now check pending... 
    var stats = [   {chances: attributes.persuasive.secondChances, pendingText: 'a Coffee at Caligula', inviteFunc: inviteCoffee}, 
                    {chances: attributes.watchful.secondChances, pendingText: 'a Game of Chess', inviteFunc: inviteChess}, 
                    {chances: attributes.dangerous.secondChances, pendingText: 'a Sparring Bout' , inviteFunc: inviteSpar}, 
                    {chances: attributes.shadowy.secondChances, pendingText: 'a spot of Suspicious Loitering', inviteFunc: inviteLoiter}
                ];

    for (var i = 0; i < stats.length; i++) {
        var stat = stats[i];

        var pending = messages.filter(function(msg) {
            return msg.indexOf(stat.pendingText) > -1;
        }).length;

        if (pending + stat.chances < 2) {
            //Send them! 
            goToStory(function() { 
                stat.inviteFunc( function() { 
                    goToStory(function() { 
                        stat.inviteFunc(callback) 
                    }); 
                }); 
            });
            return true; 
        }
    }

    return false; //everything is just dandy with our stats
}

//The Alleys of Spite 
//The Pickpocket's Promenade!
//goToStory - hit onwards actually
//The Tenterhooks
//goToStory
function considerPromenade(cards, messages, attributes, callback) {
    if (attributes.suspicion.total < 4 && attributes.actions.value > 15 && cards.waiting <= 2 && cards.waiting >= 1) {
        //Let's go for a promenade and refresh our opportunity cards!
        loge("Going to pickpocket to refresh cards.");
        travelTo('Spite', function() {
            clickStorylet('The Alleys of Spite', function() {
                clickStorylet("The Pickpocket's Promenade!", function() {
                    goToStorySimple(function() {
                        clickStorylet('The Tenterhooks', function() {
                            loge("Entered the promenade.");
                            handlePromenade(callback);
                            return;
                        });
                    });
                });
            });
        });
        return true;
    }

    return false;
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
    loge("Inviting someone for coffee...");
    clickStorylet('Attend to matters of society and scandal', function() {
        clickStorylet("Meet someone for a Coffee at Caligula's", function() {
            choosePlayer(buddy, function() {
                loge("Invited to coffee.");
                callback();
            });
        });
    });
}

function inviteChess(callback) {
    loge("Inviting someone for chess!");
    clickStorylet('Invite a friend to join you in something terribly intellectual', function() {
        clickStorylet('Invite someone to a Game of Chess', function() {
            choosePlayer(buddy, function() {
                loge("Player invited for chess!");
                callback();
            });
        });
    });
}

function inviteSpar(callback) {
    loge("Inviting someone to spar!");
    clickStorylet('Invite a friend to join you in something potentially dangerous', function() {
        clickStorylet('Invite someone to a Sparring Bout', function() {
            choosePlayer(buddy, function() {
                loge("Player invited for sparring!");
                callback();
            });
        });
    });
}

function inviteLoiter(callback) {
    loge("Inviting someone to loiter!");
    clickStorylet('Invite a friend to join you in something rather shadowy', function() {
        clickStorylet('Invite someone to a spot of Suspicious Loitering', function() {
            choosePlayer(buddy, function() {
                loge("Player invited for loitering!");
                callback();
            });
        });
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
                choosePlayer(receiver, function() { reloadPage(callback) });
            });
        });
    } else {
        loge("Not enough second chances to use gift!");
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