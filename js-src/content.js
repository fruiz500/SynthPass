/**
 * SynthPass
 * © 2026 Francisco Ruiz. All Rights Reserved.
 * * This source code is "Source-Available" for security auditing purposes only.
 * Redistribution, modification, or commercial use is strictly prohibited 
 * without explicit permission from the author.
 * * "Servers are Evil."
 */

//returns true if an element is hidden
function isHidden(el) {
	return (el.offsetParent === null)
}

function findUserIdField() {
	// Priority 1: Modern accessibility/autocomplete markers
	const prioritySelectors = [
		'input[autocomplete="username"]',
		'input[autocomplete="email"]',
		'input[type="email"]',
		'input[name*="user" i]',
		'input[name*="login" i]',
		'input[name*="email" i]'
	];

	for (let selector of prioritySelectors) {
		const el = document.querySelector(selector);
		if (el && el.offsetParent !== null) return el; // Must be visible
	}

	// Priority 2: Fallback to the first visible text input that isn't a search box
	return Array.from(document.querySelectorAll("input[type='text']"))
		.find(el => el.offsetParent !== null && !el.name.match(/search|q/i));
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "clicked_OK") {
            const passwords = request.passwords;
            const fields = document.querySelectorAll('input[type="password"]');
            let filledCount = 0;

            if (passwords && fields.length > 0) {
                fields.forEach((field, i) => {
                    const val = passwords[i] || passwords[0];
                    field.value = val;
                    filledCount++;

                    ['input', 'change', 'keydown', 'keyup'].forEach(evType => {
                        field.dispatchEvent(new Event(evType, { bubbles: true }));
                    });

                    setTimeout(() => {
                        field.value = val;
                        field.dispatchEvent(new Event('input', { bubbles: true }));
                    }, 200);
                });
            }

            if (request.userID) {
                const target = findUserIdField(); // Assuming this helper is defined in your file
                if (target) {
                    target.value = request.userID;
                    ['input', 'change', 'blur'].forEach(ev => {
                        target.dispatchEvent(new Event(ev, { bubbles: true }));
                    });
                    // Optional: Increment filledCount if you consider a User ID fill as a "success"
                }
            }

            // Return the actual results to the popup
            sendResponse({ 
                success: filledCount > 0, 
                count: filledCount 
            });
            
            return true; // Keeps the message channel open for the async response
        } else if (request.message === "send_data") {
            sendData();
        }
    }
);

//the rest executes upon loading or per request
function sendData() {
	window.pwdId = [];										//global variables  that will be used later
	window.textId = [];

	var inputElements = document.querySelectorAll("input"),
		userDone = false;

	for (var i = 0; i < inputElements.length; i++) {		//this is to avoid counting boxes that are on the page but not visible
		if (!isHidden(inputElements[i])) {
			if (inputElements[i].type == 'password') {
				pwdId.push(inputElements[i])
				if (i > 0) {								//detect single text or email input immediately before, skipping hidden inputs
					if (!userDone) {
						var j = 1;
						while (isHidden(inputElements[i - j]) && j < i) j++;
						if (inputElements[i - j].type == 'text' || inputElements[i - j].type == 'email') {
							textId = [inputElements[i - j]];
							userDone = true
						}
					}
				}
			}
		}
	}

	const userField = findUserIdField();
    const currentVal = userField ? userField.value : "";

	//send data to the popup
	chrome.runtime.sendMessage({
        message: "start_info",
        host: window.location.hostname,
        pwdCount: document.querySelectorAll('input[type="password"]').length,
        currentUserId: currentVal // Report what's already on the page
    });
}

//send data the fist time it loads
sendData()