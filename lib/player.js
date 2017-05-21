//Returns your currently drawn cards.
function getCards(callback) {
    goToStory(function() {
        var cards = page.evaluate(function() {
            var cardNodes = document.querySelector('#cards').querySelectorAll('li');
            var hand = [];
            for (var i = 0; i < cardNodes.length; i++) {
                if (cardNodes[i].querySelector('h3')) {
                    hand.push(cardNodes[i].querySelector('h3').innerHTML);
                }
            }

            var firstWord = document.querySelector('.deck-contents-description').textContent.trim().split(' ')[0];
            if (firstWord == "No") {
                var waiting = 0;
            } else {
                var waiting = parseInt(firstWord);
            }

            var cards = {'hand': hand, 'waiting': waiting, 'emptySlots': cardNodes.length - hand.length};
            return cards;
        });
        callback(cards);
    });
}

//Hits 'discard' button on card
function discardCard(card, callback) {
    goToStory(function() {
        page.evaluate(function(card) {
            var cardNodes = document.querySelector('#cards').querySelectorAll('li');
            for (var i = 0; i < cardNodes.length; i++) {
                var cardTitle = cardNodes[i].querySelector('h3');
                if (cardTitle && cardTitle.innerHTML == card) {
                    //Discard this one
                    cardNodes[i].querySelector('.discard_btn').click();
                    return;
                }
            }
        }, card);
        setTimeout(callback, 200);
    });
}

//Draws cards, if possible.
function drawCards(callback) {
    goToStory(function() {
        setTimeout(function() {
            page.evaluate(function() {
                var cardDrawNode = document.querySelector('#cardDeckLink');
                if (cardDrawNode) {
                    cardDrawNode.click();
                }
            });
            setTimeout(function() { getCards(callback); }, 1000);
        }, 500); //Wait a second just in case things have not loaded yet
    });
}

//Gets all the names of your items from the 'myself' tab.
function getInventory(callback) {
    goToMyself(function() {
        var inventory = page.evaluate(function() {
            var inventory = {};

            var invNode = document.querySelector('.me-page-inventory');
            var items = invNode.querySelectorAll('.tooltip');
            for (var i = 0; i < items.length; i++) {
                var item = items[i].querySelector('span.tt > strong').innerHTML.split(" x ");
                var quantity = item[0];
                var name = item[1];
                inventory[name] = quantity;
            }

            var invNode = document.querySelector('.you_bottom_rhs');
            var items = invNode.querySelectorAll('li');
            for (var i = 0; i < items.length; i++) {
                if (items[i].querySelector('.tooltip')) {
                    var item = items[i].querySelector('span.tt > strong').innerHTML.split(" x ");
                    var quantity = item[0];
                    var name = item[1];
                    inventory[name] = quantity;
                }
            }

            return inventory;
        });
        callback(inventory);
    });
}

function getSellableInventory(callback) {
    goToBazaar(function() {
        var inventory = page.evaluate(function() {
            var inventory = [];
            
            //Don't need to use the pager, it's all there in the html!
            var pageItems = document.querySelectorAll('.shop-item');
            for (var i = 0; i < pageItems.length; i++) {
                //Construct the item!
                item = {};
                item.quantity = pageItems[i].querySelector('.item-quantity').innerHTML;
                item.name = pageItems[i].querySelector('.item-details > h6').innerHTML.trim();
                if (pageItems[i].querySelector('.price.currency-echo')) {
                    item.sellPrice = pageItems[i].querySelector('.price.currency-echo').innerHTML;
                } else {
                    item.sellPrice = 0; //TODO
                }
                inventory.push(item);
            }
            

            return inventory;
        });
        callback(inventory);
    });
}

function getMessagesToYou(callback) {
    goToMessages(function() {
        //bordered-panel with-buttons feedmessage
        var messages = page.evaluate(function() {
            var messages = [];

            //Outgoing messages use .feedmessage
            var messageNodes = document.querySelectorAll('.feedmessage > p');
            for (var i = 0; i < messageNodes.length; i++) {
                messages.push(messageNodes[i].textContent.replace(/\n/g, " "));
            }

            return messages;
        });
        callback(messages);
    });
}

function acceptMessage(message, callback) {
    goToMessages(function() {
        page.evaluate(function(message) {
            var messageNodes = document.querySelectorAll('.feedmessage > p');
            for (var i = 0; i < messageNodes.length; i++) {
                if (messageNodes[i].textContent.replace(/\n/g, " ").indexOf(message) > -1) {
                    //Click!
                    var btn = messageNodes[i].parentNode.querySelector('.feedMessageAccept');
                    btn.click();
                }
            }

            return;
        }, message);
        setTimeout(callback, 500);
    });
}

//Do not use directly! Use acceptAllMessages.
function acceptAllMessagesR(messages, callback) {
    if (messages.length == 0) {
        callback();
        return;
    }

    var message = messages.pop();
    acceptMessage(message, function() {
        acceptAllMessagesR(messages, callback);
    });
}

function acceptAllMessages(callback) {
    getMessagesToYou(function(messages) { acceptAllMessagesR(messages, callback); });
}

function getMessagesFromYou(callback) {
    goToMessages(function() {
        var messages = page.evaluate(function() {
            var messages = [];

            //This does not get the nodes themselves, but the button links within them
            //Outgoing have buttons inside the p, messages incoming don't
            var outgoingNodes = document.querySelectorAll('#FeedMessagesWithInvitations > .bordered-panel.with-buttons > p > a');
            for (var i = 0; i < outgoingNodes.length; i++) {
                messages.push(outgoingNodes[i].parentNode.textContent.trim().replace(/\n/g, " ").replace(/  +/g, " ").replace(/ *Withdraw$/, ""));
            }
            
            return messages;
        });
        callback(messages);
    });
}

function getAttributesUnsafe() {
    var attributesRaw = page.evaluate(function() {
        var nodes = document.querySelectorAll('#lhs_col > .you_lhs > p:not(.progress)');
        var i;
        var stats = {'WATCHFUL': true, 'SHADOWY': true, 'DANGEROUS': true, 'PERSUASIVE': true};

        //Loop until watchful
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].textContent.indexOf("WATCHFUL") > -1) {
                break;
            }
        }

        //Everything follows the same pattern, now
        attributes = [];
        for (; i < nodes.length; i++) {
            var attribute = {};
            attribute.name = nodes[i].firstChild.textContent.trim();
            attribute.baseValue = parseInt(nodes[i].firstChild.nextSibling.textContent.trim());
            if (nodes[i].lastChild.textContent) {
                attribute.mod = parseInt(nodes[i].lastChild.textContent.trim());
            } else {
                attribute.mod = 0;
            }

            attribute.total = attribute.mod + attribute.baseValue;

            //Get CP from progress bar
            var progressBar = nodes[i].nextElementSibling.querySelector('img');
            attribute.cp = (Math.min(70, attribute.baseValue)) * (Math.min(70, attribute.baseValue) + 1) / 2 + 70 * Math.max(0, attribute.baseValue - 70) + Math.round(parseFloat(progressBar.getAttribute("width").split("%")[0]) / 100 * Math.min(70, attribute.baseValue + 1));
            
            try {
                var secondChancesNode = nodes[i].previousElementSibling.querySelector('.qq');
                attribute.secondChances = secondChancesNode.textContent.trim();
            } catch (e) {
                if (stats[attribute.name]) {
                    attribute.secondChances = 0; //If it's a stat as opposed to a menace, include the number of second chances
                }
            }

            attributes.push(attribute);
        }

        var attribute = {};
        attribute.name = "actions";
        attribute.value = parseInt(document.getElementById('infoBarCurrentActions').innerHTML);
        attribute.max = document.querySelector('.actions_remaining').textContent.trim().split('/')[1];
        attributes.push(attribute);

        return attributes;
    });

    var attributes = {};
    for (var i = 0; i < attributesRaw.length; i++) {
        var name = attributesRaw[i].name.toLowerCase();
        delete attributesRaw[i].name;
        attributes[name] = attributesRaw[i];
    }

    //Add menaces
    var menaces = ['suspicion', 'scandal', 'nightmares', 'wounds'];
    for (var i = 0; i < menaces.length; i++) {
        if (!attributes[menaces[i]]) {
            attributes[menaces[i]] = {'baseValue': 0, 'total': 0, 'cp': 0};
        }
    }

    return attributes;
}

function getAttributesReload(callback) {
    reloadPage(function() {
        callback(getAttributesUnsafe());
    });
}

function getLocation() {
    return page.evaluate(function() {
        return document.getElementById('area_hdr_name').textContent.trim();
    });
}