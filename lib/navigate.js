function waitForReady(callback) {
    setTimeout(function () {
        var readyState = page.evaluate(function () {
            return document.readyState;
        });

        if ("complete" === readyState) {
            setTimeout(function() {
                try {
                    callback();
                } catch (ex) {
                    var fullMessage = "\nJAVASCRIPT EXCEPTION";
                    fullMessage += "\nMESSAGE: " + ex.toString();
                    for (var p in ex) {
                        fullMessage += "\n" + p.toUpperCase() + ": " + ex[p];
                    }
                    console.log(fullMessage);
                }
            }, 100); //Add 100 ms just to be safe.
        } else {
            waitForReady(callback);
        }
    });
}

function waitFor(doneLoadingSelector, callback) {
    setTimeout(function() {
        if (page.evaluate(function(doneLoadingSelector) { return document.querySelector(doneLoadingSelector) }, doneLoadingSelector)) {
            callback();
        } else {
            waitFor(doneLoadingSelector, callback);
        }
    }, 100);
}

function waitForSelectorFilled(selector, callback) {
    setTimeout(function() {
        if (page.evaluate(function(selector) { return document.querySelector(selector) && document.querySelector(selector).firstElementChild }, selector)) {
            callback();
        } else {
            waitForSelectorFilled(selector, callback);
        }
    }, 100);
}

function waitForAjax(callback) {
    waitForSelectorFilled('#mainContentViaAjax', function() { setTimeout(callback, 1000) }); //Add an additional second for js scripts to load
}

var reloadTimer = 0;

function reloadPage(callback) {
    page.evaluate(function() {
        location.reload();
    });

    var keepGoing = true; //If the reload fails, we might accidentally have two callbacks going here, so this will serve to ensure we only have one go

    page.onLoadFinished = function() {
        page.onLoadFinished = function() { };
        waitForReady(function() {
            waitForAjax(function() { 
                waitFor('#infoBarCurrentActions', function() {
                    if (keepGoing) {
                        clearTimeout(reloadTimer); 
                        setTimeout(callback, 2000); //give it a little more time to load scripts
                    }
                });
            });
        });
    };
    reloadTimer = setTimeout(function() { keepGoing = false; reloadPage(callback); }, 20000); //If in 20 seconds this timer is not cleared, reload the page.
}

function ifMissingSelectorDoElse(selector, doFunc, elseFunc) {
    var isThere = page.evaluate(function(selector) {
        return document.querySelector(selector) != null;
    }, selector);

    if (!isThere) {
        doFunc();
    } else {
        elseFunc();
    }
}

function login(email, password, callback) {
    console.log("Connecting...");
    page.open('http://fall' + 'enlo' + 'ndon.stor' + 'yne' + 'xus.com', function(status) {
        console.log("Connected to the website. Status: " + status);
        if(status === "success") {
            waitForReady(function() {
                waitFor('#emailAddress', function() {
                    page.evaluate(function(email, password) {
                        document.querySelector('#emailAddress').value = email;
                        document.querySelector('#password').value = password;
                        document.querySelector('form').submit();
                        console.log("Login form submit.");
                    }, email, password);
                    page.onLoadFinished = function() {
                        page.onLoadFinished = function() {};
                        waitForReady(function() {
                            console.log("Logged in? If nothing happens for a minute, you likely entered a wrong username or password.");
                            waitForAjax(callback); //Wait for this part to load
                        });
                    };
                });
            });
        }
    });
}

function goToTab(tabSelector, doneLoadingSelector, callback) {
    page.evaluate(function(tabSelector) {
        var tab = document.querySelector(tabSelector);
        tab.click();
    }, tabSelector);
    waitFor(doneLoadingSelector, callback);
}

function goToMessages(callback) {
    var selector = '#FeedMessagesWithInvitations';
    ifMissingSelectorDoElse(selector, function() { goToTab('#homeTab', selector, callback); }, callback);
}

function goToBazaar(callback) {
    var selector = '.shop-categories'; //Note bug with messages!
    ifMissingSelectorDoElse(selector, function() { goToTab('#bazaarTab', selector, callback); }, callback);
}

function goToMyself(callback) {
    var selector = 'h1.character-name-header';
    ifMissingSelectorDoElse(selector, function() { goToTab('#meTab', selector, callback); }, callback);
}

function goToStory(callback) {
    var handleInStorylet = function() {
        var inStorylet = page.evaluate(function() {
            return document.querySelector('#perhapsnotbtn');
        });
        if (inStorylet) {
            page.evaluate(function() {
                document.querySelector('#perhapsnotbtn').click();
            });
            waitFor('.oppertunities-draw-header', callback)
        } else {
            callback();
        }
    };

    var selector = '.oppertunities-draw-header';
    ifMissingSelectorDoElse(selector, function() { goToTab('#storyTab', '.storylet', handleInStorylet); }, callback);
}

//Hits story tab without looking for a perhaps button
function goToStorySimple(callback) {
    var selector = '.oppertunities-draw-header';
    ifMissingSelectorDoElse(selector, function() { goToTab('#storyTab', '.storylet', callback); }, callback);
}

//Give string name of the card
function clickCard(card, callback) {
    //Check if we have cards first... 
    goToStory(function() {
        page.evaluate(function(card) {
            var cardNodes = document.querySelector('#cards').querySelectorAll('li');
            for (var i = 0; i < cardNodes.length; i++) {
                var title = cardNodes[i].querySelector('h3');
                if (title && title.innerHTML == card) {
                    cardNodes[i].querySelector('a > input').click();
                }
            }
        }, card);
        waitFor('.storylet_flavour_text', callback);
    });
}

function getStorylets() {
    var storylets = page.evaluate(function() {
        var storyletNodes = document.querySelectorAll('.storylet');
        var storylets = [];
        for (var i = 0; i < storyletNodes.length; i++) {
            var title = storyletNodes[i].querySelector('h1, h2, h3, h4, h5, h6');
            if (title) {
                storylets.push(title.innerHTML);
            }
        }
        return storylets;
    });
    return storylets;
}

function clickStorylet(storylet, callback) {
    page.evaluate(function(storylet) {
        var storyletNodes = document.querySelectorAll('.storylet');
        for (var i = 0; i < storyletNodes.length; i++) {
            var title = storyletNodes[i].querySelector('h1, h2, h3, h4, h5, h6');
            if (title && title.innerHTML == storylet) {
                storyletNodes[i].querySelector('.go > input').click();
            }
        }
    }, storylet);
    waitFor('.storylet_flavour_text', callback);
}

function getResults() {
    return page.evaluate(function() {
        var results = [];
        var resultNodes = document.querySelectorAll('.quality_update_box > div > p');
        for (var i = 0; i < resultNodes.length; i++) {
            results.push(resultNodes[i].textContent.trim());
        }
        return results;
    });
}

function clickInventoryItem(item, callback) {
    goToMyself(function() { 
        page.evaluate(function(item) {
            var invNode = document.querySelector('.you_bottom_rhs');
            var items = invNode.querySelectorAll('li');
            for (var i = 0; i < items.length; i++) {
                if (items[i].querySelector('.tooltip') && items[i].querySelector('span.tt > strong').innerHTML.indexOf(item) > -1) {
                    items[i].querySelector('.tooltip').click();
                }
            }
        }, item);

        waitFor('.storylet_flavour_text', callback);
    });
}

function choosePlayer(name, callback) {
    //Wait half a second to ensure the dropdown has enough time to load the players - not sure if this is necessary, look into this later TODO
    setTimeout(function() {
        page.evaluate(function(name) {
            var dropdown = document.getElementById("targetCharacterId");
            var players = dropdown.querySelectorAll('option');
            var selected = false;
            for (var i = 0; i < players.length; i++) {
                if (players[i].innerHTML.indexOf(name) > -1) {
                    dropdown.selectedIndex = i;
                    selected = true;
                    break;
                }
            }

            if (selected) {
                document.getElementById('ChooseActButton').click();
            } else {
                console.log("Player not selected!");
                throw new RuntimeException("Selected player not found.");
            }
        }, name);

        waitFor('.storylet_flavour_text', callback);
    }, 500); 
}

function travelTo(location, callback) {
    goToStory(function() {
        page.evaluate(function() {
            document.querySelector('.toggle-map').click();
        });

        waitFor('.unlockedMapLocation', function() {
            page.evaluate(function(location) {
                var nodes = document.querySelectorAll('#topMap > .tooltip > .tt > h3');
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].textContent.trim() == location) {
                        nodes[i].parentElement.parentElement.click();
                        return;
                    }
                }
            }, location);
            waitFor('.storylet', callback);
        });
    });
}