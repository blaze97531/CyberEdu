// Global Variables

var current_scene;
var worldButtonsEnabled = true;
var diagUp = false;
var MAX_X = 1280;
var MAX_Y = 690;
var dialogue_buttons = [];
var CANVAS_X = CANVAS_ELEMENT.getBoundingClientRect().left;
var CANVAS_Y = CANVAS_ELEMENT.getBoundingClientRect().top;

var inventory_image;
var click_sound;
	
// character_name says text in the game, nextFunc is to chain dialogue together.
function say (character_name, text, next) {
	next = typeof next !== 'undefined' ? next : closeDialogue;
	dialogue(character_name, text, [["Okay.", next]]);
}

/* Creates dialogue overlay, delays next action until response has been made.
	Takes:
		character_name: Name of character, displayed at the top right of the diag box in bigger white text.
		text: The text that is displayed. This is the "Dialogue".
		responses: Possible responses to the dialogue Array of arrays. Format is:
					[
						[
							String:Response Description,
							Function: Reponse Action
						]
					]
					If no response is specified, the default response is "Okay."
					which will simply close the dialogue and re-enable world buttons.

*/
function closeDialogue() {
	// Remove all dialogue buttons:
	dialogue_buttons = [];
	// Re-enable world buttons
	worldButtonsEnabled = true;
	diagUp = false;
	// redraw scene.
	var g = CANVAS_ELEMENT.getContext("2d");
	g.drawImage(current_scene.image(),0,0);
	g.drawImage(inventory_image,0,0);
}

function dialogue(character_name, text, responses) {
	// Setting default responses.
	responses = typeof responses !== 'undefined' ? responses : [["Okay (default).", function () { closeDialogue(); }]];
	var g = CANVAS_ELEMENT.getContext("2d");
	worldButtonsEnabled = false;
	diagUp = true;
	//Redraw current scene.
	g.drawImage(current_scene.image(),0,0); // TODO I'll be honest I do not know how the scoping on this works.
	// Dark gray overlay
	g.fillStyle = "rgba(0,0,0,0.5)";
	g.fillRect(0,0,MAX_X,MAX_Y);
	// fill out rect of diag box.
	g.fillStyle = "rgba(50,50,50,1)";
	var dimX = 600
	var dimY = 400
	// Currentl has a border of pixel size 2. Could make this bigger or smaller, probably a function to do this explicitly.
	g.fillRect(MAX_X/2 - (dimX/2 + 2), MAX_Y/2 - (dimY/2 + 2), dimX + 4, dimY + 4);
	// Fill inner rect of diag box
	g.fillStyle = "rgba(70,70,70,1)";
	g.fillRect(MAX_X/2 - dimX/2, MAX_Y/2 - dimY/2, dimX, dimY);
	
	g.fillStyle = "rgba(255,255,255,1)";
	g.font = "24px Verdana";
	g.fillText(character_name, MAX_X/2 - (dimX/2 - 8), MAX_Y/2 - (dimY/2 - 24));
	g.fillStyle = "rgba(200,200,200,1)";
	g.font = "16px Verdana";
	

	var textWidth = dimX - 16;
	var lineHeight = 20;
	var words = text.split(' ');
	var lines = [["   "]];
	var i = 0;
	
	while (i < words.length) {
		//print(g.measureText(lines[lines.length-1].join(' ') + ' ' + words[i]).width);
		while (g.measureText(lines[lines.length-1].join(' ') + ' ' + words[i]).width < textWidth && i < words.length) {
			lines[lines.length-1].push(words[i]);
			i++;
		}
		// Line has over filled, so add a new line in and continue from there
		lines.push([""]);
	}
	// Write what we have said in the conversation.
	for (var j = 0; j < lines.length; j ++) { 
		g.fillText(lines[j].join(' '), MAX_X/2 - (dimX/2 - 8), MAX_Y/2 - (dimY/2 - 44 - lineHeight*j));
	}
	dialogue_buttons = []; // MAKE SURE DIALOGUE BUTTONS ARE CLEAN.
	// Now load the responses:
	// TODO support more than one response.
	g.fillStyle = "rgba(80,80,80,1)";
	dialogue_buttons[dialogue_buttons.length] = new Button(MAX_X/2 - (dimX/2) + 10, 
														   MAX_Y/2 + dimY/2 - 100,
														   MAX_X/2 + (dimX/2) - 10, 
														   MAX_Y/2 + dimY/2,
														   responses[0][1]);
	g.fillRect(MAX_X/2 - (dimX/2) + 10, MAX_Y/2+dimY/2-110, dimX - 20, 100);
	g.fillStyle = "rgba(200,200,200,1)";
	g.font = "16px Verdana";
	g.fillText(responses[0][0], MAX_X/2 - (g.measureText(responses[0][0]).width/2), MAX_Y/2 + dimY/2 - 50);
	
	//Draw GUI overlay.
	g.drawImage(inventory_image,0,0) 
}

/*********************
Scene Class Definition
**********************/
// Class definition for a scene. A scene is a image and a list of buttons. 	
// Constructor
var Scene = function (img_no) {
	this.img_no = img_no;
	this.buttons = [];
	this.run_after_action = function () {};
};

Scene.prototype.image = function () {
	return img_list[this.img_no];
};

Scene.prototype.addButton = function (button) {
	this.buttons[this.buttons.length] = button;
};

Scene.prototype.setRunAfterAction = function (f) {
	this.run_after_action = f;
}
// End Scene Class

/**********************
Button Class Definition
***********************/

// Class definition for rectangular button 
// A button must be added to a scene to do anything. 
// Buttons are enabled by default. Disabling a button makes it unclickable until it is enabled again.

// Constructor
var Button = function(topLeftX, topLeftY, bottomRightX, bottomRightY, fun) {
	this.x1 = topLeftX;
	this.y1 = topLeftY;
	this.x2 = bottomRightX;
	this.y2 = bottomRightY;
	this.action = fun;
	this.enabled = true;
};

// returns true if a point is within the bounds of the button
Button.prototype.isWithinBounds = function(x, y) {
	return (this.enabled && this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2);
};

// calls the function given as the event for this button
Button.prototype.doAction = function() {
	this.action();
};

Button.prototype.reactToClickAt = function(x, y) {
	if (this.isWithinBounds(x, y)) {
		this.doAction();
		return true;
	}
	return false;
};

Button.prototype.setEnabled = function(b) {
	this.enabled = b;
};
// End Button class



function click_position(event) {
	// Compatibility Code taken from http://www.quirksmode.org/js/events_properties.html
	var e = event || window.event;
	var posx = 0;
	var posy = 0;
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	}
	else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop
			+ document.documentElement.scrollTop;
	}
	posx -= CANVAS_X;
	posy -= CANVAS_Y;
	// End compatibility code, posx & posy contain the clicked position
	
	// Cause event(s) to occur based on the location of the mouse click.
	if (worldButtonsEnabled) {
		for (var i = 0; i < current_scene.buttons.length; i++) {
			if (current_scene.buttons[i].reactToClickAt(posx, posy)) {
				click_sound.play();
			}
		}
	}
	for (var i = 0; i < persistent_buttons.length; i++) {
		if (persistent_buttons[i].reactToClickAt(posx, posy)) {
			// play click sound for audio
			click_sound.play();
		}
	}
	
	for (var i = 0; i < dialogue_buttons.length; i++) {
		if (dialogue_buttons[i].reactToClickAt(posx, posy)){
			// play click sound for audio
			click_sound.play();
		}

	}
	if (worldButtonsEnabled)
		current_scene.run_after_action();
}

function rollover_position(event) {
	// Compatibility Code taken from http://www.quirksmode.org/js/events_properties.html
	var e = event || window.event;
	var posx = 0;
	var posy = 0;
	if (e.pageX || e.pageY) {
		posx = e.pageX;
		posy = e.pageY;
	}
	else if (e.clientX || e.clientY) {
		posx = e.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop
			+ document.documentElement.scrollTop;
	}
	posx -= CANVAS_X;
	posy -= CANVAS_Y;
	// End compatibility code, posx & posy contain the clicked position
	
	document.getElementById("text").innerHTML = "(" + posx + ", " + posy + ")";
	
	var found = false;
	// Display rollover for the world interactions, if flag for worldButtons are enabled.
	if (worldButtonsEnabled) {
		for (var i = 0; i < current_scene.buttons.length; i++) {
			if (current_scene.buttons[i].isWithinBounds(posx, posy)) {
				found = true;
			}
		}
	}
	
	// Handle rollover for GUI elements
	for (var i = 0; i < persistent_buttons.length; i++) {
		if (persistent_buttons[i].isWithinBounds(posx, posy)) {
			found = true;
		}
	}
	
	// Handle rollover for any dialogue buttons displayed on the screen.
	for (var i = 0; i < dialogue_buttons.length; i++) {
		if (dialogue_buttons[i].isWithinBounds(posx, posy)) {
			found = true;
		}
	}
	
	
	if (found)
		CANVAS_ELEMENT.style.cursor = "pointer";
	else
		CANVAS_ELEMENT.style.cursor = "auto";
}

function changeScene(new_scene) {
	current_scene = new_scene;
	var g = CANVAS_ELEMENT.getContext("2d");
	g.drawImage(current_scene.image(),0,0);
	g.drawImage(inventory_image,0,0); 
	current_scene.run_after_action();
}

// A list of buttons that exist in multiple scenes, such as the inventory buttons.
var persistent_buttons = [];

persistent_buttons[persistent_buttons.length] = 
	new Button(77,557, 122, 602, function() { print("Inventory slot one pressed."); }) 
persistent_buttons[persistent_buttons.length] = 
	new Button(137,557, 182, 602, function() { print("Inventory slot two pressed."); })
persistent_buttons[persistent_buttons.length] = 
	new Button(197,557, 242, 602, function() { print("Inventory slot three pressed."); })
persistent_buttons[persistent_buttons.length] = 
	new Button(257,557, 302, 602, function() { print("Inventory slot four pressed."); })

var player_name = "Bobby";
var partner_name = "Ashley";

// Declaring the various scenes in the game
var coffee_shop = new Scene (0);
var spoken_to_witness1 = false;
var spoken_to_witness2 = false;
var spoken_to_witness3 = false;
var spoken_to_tophat = false;
var spoken_to_suspect1 = false;
var spoken_to_suspect2 = false;
var spoken_to_culprit = false;
var spoken_to_all_witnesses = false;
var spoken_to_all_suspects = false;
var entry_message_shown = false;
var incorrect_guesses = 0;
var manager = new Button (207, 127, 282, 281, function () { 
	if (spoken_to_all_witnesses && spoken_to_all_suspects) {
		say("Manager", "Do you know who did it?", function () { 
			say("", "Click on the person responsible for these crimes!", closeDialogue());
		});
		suspect1.setEnabled(true);
		suspect2.setEnabled(true);
		culprit.setEnabled(true);
	}
	else {
		say(player_name, "Hello, ma'am. We are the detectives you called for. Do you have any leads?", function() { 
			say("Manager", "The guy in the suit with a top hat, the guy in the light blue shirt in the back corner, and the girl in a red shirt sitting at the counter all reported to me that they had been robbed after leaving " +
				"here.", function () {
				say(partner_name, "Let's go talk to the victims, " + player_name + ".", closeDialogue());
			});
		});
		manager.setEnabled(false);
	}
});
var witness1 = new Button (763, 174, 792, 224, function () { 
	say(player_name, "Good morning. I'm a detective investigating the robberies that have been occurring here. What can you tell me?", function () {
		say("Shorts", "I ordered Halloween decorations for my house online through amazon.com, using a credit card, last week while sitting in this cafe. The tracking on the package said that the decorations had indeed shipped, " +
		"and are in a warehouse in Clarksville, Maryland, and probably will be delivered in one or two days. I used my card once in the grocery store since then, but on my credit card bill I noticed that there was also a charge " +
		"for a laptop battery on it as well. I just found out today and I'll contact the credit card company once the customer service line opens up.", closeDialogue()); 
	});
	spoken_to_witness1 = true; 
	witness1.setEnabled(false); 
});
var witness2 = new Button (884, 207, 919, 230, function () {
	say(player_name, "Hello. I'm a detective investigating the robberies that happened here. Do you have any information that could help me?", function () { 
		say("White Pants", "I was in a hurry coming into work yesterday and did not have time to pay my credit card bill at my house. Since I cannot live without my morning coffee, I came here and paid my bill online. The " +
			"payment was successfully received, but that afternoon, when I went to the ATM to withdraw some cash, I found that my bank account balance, which should have been $342, was 0. I then went to the bank for a statement " +
			"to see if there had been a mistake. The statement showed someone electronically withdrew the $342 I had, and transferred the money to a Capital One bank account.", closeDialogue());
	});
	spoken_to_witness2 = true; 
	witness2.setEnabled(false); 
});
var witness3 = new Button (411, 158, 473, 363, function () {
	say(player_name, "Hello, I'm a detective investigating the robberies here. Do you know anything " +
		"about them?", function () {
		say("Black Shirt", "I have not been robbed. I've never used a computer in here before, so I " +
			"think that the robberies have something to do with people's computers.", closeDialogue());
	});
	spoken_to_witness3 = true;
	witness3.setEnabled(false);
});
var tophat = new Button (622, 238, 694, 310, function () { 
	say(player_name, "Hello, sir. I'm a detective investigating the robberies that happened here. Can you tell me anything about what happened to you?", function () { 
		say("Top Hat", "Two days ago, I was here, browsing the internet on my laptop looking for top hats, because I need one for my role as Abraham Lincoln in the theatre production I am a part of. I purchased one online from" +
			" amazon.com, using a credit card. The purchase itself was not a scam, for the top hat did arrive as promised. I'm wearing it now. I haven't made any other purchases with the card since, so I am pretty sure my card" +
			" information was stolen here. Whoever has my card number used it to purchase a USB mouse. I cancelled that card but I couldn't remove my liability from the mouse purchase.", closeDialogue());
	});
	spoken_to_tophat = true; 
	tophat.setEnabled(false); 
});
var suspect1 = new Button (771, 341, 884, 456, function () { 
	if (spoken_to_all_witnesses && spoken_to_all_suspects) {
		incorrect_guesses++;
		say(player_name, "The man in the red shirt is responsible.", function () {
			say("Manager", "Okay, I'll call the police.", function () {
				say("Police", "Sir, we have reasonable suspicion to believe that you are the one responsible for the recent robberies at this cafe.", function () {
					say("Red Shirt", "Huh? I haven't robbed anyone.", function () {
						say("Police", "This guy's innocent, " + player_name + ". You got the wrong guy.", function () {
							if (incorrect_guesses == 1)
								closeDialogue();
							else
								say("Police", "Man, this " + player_name + " is the worst detective ever!");
						});
					});
				});
			});
		});
		suspect1.setEnabled(false);
	}
	else {
		say(player_name, "Hello, I'm investigating robberies that have been occurring here recently. Have  you heard anything about them?", function () { 
			say("Red shirt", "No, I've never been robbed here. I'm not using the internet. I've come here for inspiration to attempt to start writing a book.", closeDialogue());
		});
		spoken_to_suspect1 = true; 
		suspect1.setEnabled(false); 
	}
});
var suspect2 = new Button (1199, 213, 1269, 267, function () { 
	if (spoken_to_all_witnesses && spoken_to_all_suspects) {
		incorrect_guesses++;
		say(player_name, "The man in the gray suit is responsible.", function () {
			say("Manager", "Okay, I'll call the police.", function () {
				say("Police", "Sir, we have reasonable suspicion to believe that you are the one responsible for the recent robberies at this cafe.", function () {
					say("Gray Suit", "What! I didn't do it! I swear!", function () {
						say("Police", "Mmm. I don't see anything malicious. I think you got the wrong guy.", function () {
							if (incorrect_guesses == 1)
								closeDialogue();
							else
								say("Police", "Man, this " + player_name + " is the worst detective ever!");
						});
					});
				});
			});
		});
		suspect2.setEnabled(false);
	}
	else {
		say(player_name, "I'm investigating the robberies here. Do you have any information about them?", function () { 
			say("Gray Suit", "I've never been robbed here. I don't come here often. I'm just looking at cat pictures on the internet. Isn't this the cutest cat you ever saw.", function () { 
				say(partner_name, "No. That's an ugly looking cat.", function () { 
					say("Gray Suit", "How dare you! That's the second cutest cat in the world, second to mine! What about you. What do you think?", function () { 
						say(player_name, "I don't know. Ask me on another day.", closeDialogue());
					});
				});
			});
		});
		spoken_to_suspect2 = true;
		suspect2.setEnabled(false); 
	}
});
var culprit = new Button (972, 293, 1036, 363, function () { 
	if (spoken_to_all_witnesses && spoken_to_all_suspects) {
		say(player_name, "The man in the blue shoes is responsible.", function () { 
			say("Manager", "Okay, I'll call the police.", function () {
				say("Police", "Sir, we have reasonable suspicion to believe that you are the one responsible for the recent robberies at this cafe.", function () {
					say("Blue Shoes", "I swear I'm innocent!", function () {
						say("Police", "Well, the processes running on your PC show otherwise. You're downloading all the traffic from the Wi-Fi onto your computer! You're under arrest for fraud and robbery. You have the " +
							"right to remain silent. Anything you say in court can and will be used against you. You have the right to an attorney. If you cannot afford one, one will be provided for you.", function () {
							say("Manager", "Why'd you do it?", function () {
								say("Blue Shoes", "I was fired two years ago by a Starbucks in Ohio. Since then, I've been wandering the country, and I'm running out of money. It was the only thing I could do.", function () {
									say("Manager", "Thank you for your help, " + player_name + " and " + partner_name + ". With the robber in custody, I'll be able to resume business as usual again. I'll post a notice " +
									"regarding the risk of using my public network for financial transactions. ", function () {
										say("Shorts", "Yeah, thanks guys! I had no idea that wireless network connections could be easily intercepted, even if the website itself is secure. I won't by anything on a public " +
										"network again.", function () {
											say("Manager", "For your help, I am pleased to offer you both a $" + (30-10*incorrect_guesses) + " gift certificate. Please accept it as a token of my thanks.", function () {
												say(partner_name, "Thank you very much, ma'am.", function () {
													say(player_name, "Thanks a lot.", function () {
														closeDialogue();
														socket.emit('scene_complete', { scene: "coffee_shop", score: 30-10*incorrect_guesses });
														changeScene(start);
														goToCoffeeShopButton.setEnabled(false);
														play_video("mfa");
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});
		});
		culprit.setEnabled(false);
	}
	else {
		say(player_name, "Hello, sir. I'm working on a case involving robberies at this cafe. Do you know anything pertinent to that matter?", function () { 
			say("Blue Shoes", "No, I don't. I've never been robbed here. I just lost my job in Cincinnati, and I came here. I'm playing Words with Friends while I wait for job application responses.", closeDialogue());
		});
		spoken_to_culprit = true;
		culprit.setEnabled(false); 
	}
}); // Obviously cannot have this in the final code. Will refractor later.
coffee_shop.setRunAfterAction(function () { 
	if (!entry_message_shown) {
		say(partner_name, "Let's speak to the manager and let her know we are here. She's behind the counter.", function () { entry_message_shown = true; closeDialogue(); });
		// Delaying adding the buttons until after the entry message is shown. This prevents people from skipping it by double clicking 
		// on the "Go to the Coffee Shop button", which triggers the top hat's dialogue, because they are in the same position on the screen.
		coffee_shop.addButton(manager);
		coffee_shop.addButton(witness1);
		coffee_shop.addButton(witness2);
		coffee_shop.addButton(witness3);
		coffee_shop.addButton(tophat);
		coffee_shop.addButton(suspect1);
		coffee_shop.addButton(suspect2);
		coffee_shop.addButton(culprit);
	}
	else if (entry_message_shown && !spoken_to_all_witnesses && spoken_to_witness1 && spoken_to_witness2 && spoken_to_tophat && spoken_to_witness3 && (!spoken_to_suspect1 || !spoken_to_suspect2 || !spoken_to_culprit)) {
		say(partner_name, "Let's interview everyone else in here we haven't yet, they might have information or be the one responsible for these robberies.", closeDialogue());
		spoken_to_all_witnesses = true;
	}
	else if (spoken_to_witness1 && spoken_to_witness2 && spoken_to_tophat && spoken_to_witness3 && spoken_to_suspect1 && spoken_to_suspect2 && spoken_to_culprit && !spoken_to_all_suspects) {
		say(partner_name, "Let's talk to the manager and tell him who did it.", closeDialogue());
		spoken_to_all_witnesses = true;
		spoken_to_all_suspects = true;
		manager.setEnabled(true);
	}
});

var start = new Scene (1);
var goToCoffeeShopButton = new Button (300, 100, 940, 400, function () { changeScene(coffee_shop); });
var goToTheMallButton = new Button (300, 470, 532, 530, function () { changeScene(mall); });
start.addButton(goToCoffeeShopButton);
start.addButton(goToTheMallButton);

var mall = new Scene (3);
var goToFreePhoneSoftware = new Button(300, 457, 873, 690, function () { changeScene(free_phone_software); });
var goToHookMyPhoneUp = new Button (569, 68, 993, 367, function () { changeScene(hook_my_phone_up); });
var goToOpenSourcePhones = new Button (41, 68, 451, 367, function () { changeScene (open_source_phones); });
mall.addButton(goToFreePhoneSoftware);
mall.addButton(goToHookMyPhoneUp);
mall.addButton(goToOpenSourcePhones);

var free_phone_software = new Scene (4);
free_phone_software.addButton(goToTheMallButton);

var hook_my_phone_up = new Scene (5);
hook_my_phone_up.addButton(goToTheMallButton);

var open_source_phones = new Scene (6);
open_source_phones.addButton(goToTheMallButton);

function go () {
	inventory_image = img_list[2];
	click_sound = audio_list[0];
	changeScene(start);
}

/* Returns to the game after playing a video (or any action that deleted the canvas) */
function return_to_game () {
	document.getElementById('viewport').innerHTML = HTML_FOR_CANVAS;
	CANVAS_ELEMENT = document.getElementById("view")
	var g = CANVAS_ELEMENT.getContext("2d");
	g.drawImage(current_scene.image(),0,0);
	g.drawImage(inventory_image,0,0);
	current_scene.run_after_action();
}