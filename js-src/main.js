/**
 * SynthPass
 * © 2026 Francisco Ruiz. All Rights Reserved.
 * * This source code is "Source-Available" for security auditing purposes only.
 * Redistribution, modification, or commercial use is strictly prohibited 
 * without explicit permission from the author.
 * * "Servers are Evil."
 */

// This is the main code for SynthPass

//global variables that will be used in computations
var websiteName, cryptoStr = '', masterPwd, mainMsg, activeTab;

//gets executed with the OK button
async function doStuff() {
	const mpInput = document.getElementById("m-pass");
	const masterPwd = mpInput.value.trim();
	const serial = document.getElementById("serial").value.trim();
	const lengthStr = document.getElementById("length-limit").value.trim();
	const allowedInput = document.getElementById("allowed-chars").value.trim();

	if (!masterPwd) {
		mainMsg.textContent = "Master Key required.";
		return;
	}

	// Unified helper replaces the manual session/UI setup
	cacheMasterKey(masterPwd);

	// Parse synthesis parameters
	const lengthVal = parseInt(lengthStr.replace(/[^0-9]/g, '')) || 44;
	const combinedInput = (lengthStr + " " + allowedInput).toLowerCase();
	const isPin = /\b(pin|num|numeric|numbers)\b/.test(combinedInput);
	const isAlpha = /\b(al|alpha|alphanumeric|lowercase|uppercase|hex)\b/.test(combinedInput);

	// Synthesize and slice
	const synthesized = pwdSynth(1, masterPwd, serial, isPin, isAlpha, lengthStr);
	const finalPwd = synthesized.slice(0, lengthVal);

	// Hand off to the unified filler
	finalizeAndFill(finalPwd);
}

/**
 * Unified function to save settings and inject a password (synthesized or vault).
 */
function finalizeAndFill(pwd) {
	if (!pwd) return;

	saveHostData();

	chrome.tabs.sendMessage(activeTab.id, {
		message: "clicked_OK",
		passwords: [pwd],
		userID: document.getElementById("userID").value.trim()
	}, (response) => {
		// If the script explicitly says 'no target' or fails to respond
		if (chrome.runtime.lastError || !response || !response.success || response.count === 0) {
			copyAndScheduleClear(pwd);
			mainMsg.textContent = "Copied to clipboard (1 min).";
		} else {
			mainMsg.textContent = "Filled successfully.";
		}
	});
}

//synthesizes a new password, or stores and retrieves one provided by user
function pwdSynth(boxNumber, pwd, serial, isPin, isAlpha, pwdLength) {
	if (!pwd) return "";

	const isClassic = document.getElementById('classic-mode').checked;
	const hashBytes = wiseHash(pwd, websiteName + serial.trim());
	if (!hashBytes) throw new Error("Key derivation failed.");

	if (isClassic) {
		// --- CLASSIC ENGINE ---
		let classicBase64 = btoa(String.fromCharCode.apply(null, hashBytes));
		let result = "";

		if (isPin) {
			result = classicBase64.replace(/[AaBbC]/g, '0').replace(/[cDdEe]/g, '1').replace(/[FfGgH]/g, '2').replace(/[hIiJj]/g, '3').replace(/[KkLlM]/g, '4').replace(/[mNnOo]/g, '5').replace(/[PpQqR]/g, '6').replace(/[rSsTt]/g, '7').replace(/[UuVvW]/g, '8').replace(/[wXxYy]/g, '9').match(/[0-9]/g).join('');
		} else if (isAlpha) {
			result = classicBase64.replace(/\+/g, 'a').replace(/\//g, 'b').replace(/=/, 'c');
		} else {
			const customChars = pwdLength.match(/[^0-9a-z\s]/gi)?.join('') || "";
			const currentBase = buildAllowedCharset(customChars);
			if (!currentBase || currentBase === "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
				result = classicBase64.replace(/[+/=Aa]/g, '_').replace(/[BbCc]/, '!').replace(/[DdEe]/, '#');
			} else {
				const legacyBase = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" + currentBase;
				result = legacyBase.charAt(62) + changeBase(classicBase64.replace(/=$/g, ''), "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", legacyBase);
			}
		}
		return result;
	} else {
		// --- MODERN ENGINE ---
		// Fix: Use ONLY the allowed-chars field for charset, matching Privacy Bar
		const allowedInput = document.getElementById("allowed-chars")?.value.trim() || "";
		const defaultCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-+=";
		let charset = allowedInput ? buildAllowedCharset(allowedInput) : defaultCharset;

		let bigIntHash = BigInt(0);
		for (let i = 0; i < hashBytes.length; i++) {
			bigIntHash = (bigIntHash << 8n) + BigInt(hashBytes[i]);
		}

		// Safety Guard: Prevent division by zero crash
		const baseBI = BigInt(charset.length);
		if (baseBI === 0n) throw new Error("Invalid character set.");

		let synthesized = "";
		while (bigIntHash > 0n) {
			synthesized = charset[Number(bigIntHash % baseBI)] + synthesized;
			bigIntHash /= baseBI;
		}
		
		// Slicing logic is now handled in doStuff to maintain consistency
		return synthesized;
	}
}

// Helper function to build charset from user input
function buildAllowedCharset(inputStr) {
	const keywordMap = {
		numbers: "0123456789",
		numeric: "0123456789",
		alpha: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
		alphanumeric: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
		lowercase: "abcdefghijklmnopqrstuvwxyz",
		uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
		hex: "0123456789abcdef",
	};

	let charset = "";
	// Split input into keywords and literals
	const parts = inputStr.match(/[a-z]+|[^a-z]+/gi) || [];

	parts.forEach((part) => {
		const lowerPart = part.toLowerCase();
		if (keywordMap[lowerPart]) {
			charset += keywordMap[lowerPart];
		} else {
			// Add literal characters as-is
			charset += part;
		}
	});

	// Remove duplicates and spaces
	return Array.from(new Set(charset.split("")))
		.join("")
		.replace(/\s+/g, "");
}

//what happens when the content script sends something back
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message == "start_info") {
			activeTab = sender.tab;
			mainMsg = document.getElementById("mainMsg");
			// 1. Identify the website domain
			var hostParts = request.host.split('.');
			if (hostParts[hostParts.length - 1].length == 2 && hostParts[hostParts.length - 2].length < 4) {
				websiteName = hostParts.slice(-3).join('.');
			} else {
				websiteName = hostParts.slice(-2).join('.');
			}

			// 2. Load stored settings and vault status
			fetchStoredData(request.currentUserId);

			// 3. Safety timeout to close the popup if forgotten
			setTimeout(function () {
				window.close();
			}, 300000);
		}
	}
);

/**
 * Copies text to clipboard and attempts to clear it after 60 seconds.
 */
function copyAndScheduleClear(text) {
	if (!text) return;

	// 1. Create a hidden textarea to host the text
	const textArea = document.createElement("textarea");
	textArea.value = text;
	textArea.style.position = "fixed";
	textArea.style.left = "-9999px";
	textArea.style.top = "0";
	document.body.appendChild(textArea);

	// 2. Select and Copy
	textArea.focus();
	textArea.select();
	const successful = document.execCommand('copy');
	document.body.removeChild(textArea);

	if (successful) {
		mainMsg.textContent = "Copied to clipboard (1 min).";

		// 3. Schedule Clear (runs as long as the popup stays open)
		setTimeout(() => {
			const clearArea = document.createElement("textarea");
			clearArea.value = ""; // Empty string to clear
			document.body.appendChild(clearArea);
			clearArea.select();
			document.execCommand('copy');
			document.body.removeChild(clearArea);

			if (mainMsg.textContent === "Copied to clipboard (1 min).") {
				mainMsg.textContent = "Clipboard cleared.";
			}
		}, 60000);
	} else {
		mainMsg.textContent = "Clipboard access denied.";
	}
}

async function changeSynth() {
	const masterPwd = document.getElementById("m-pass").value.trim();
	const serial = document.getElementById("serial").value.trim();
	const lengthInput = parseInt(document.getElementById("length-limit").value) || 44;
	const allowedInput = document.getElementById("allowed-chars").value.trim();

	if (!masterPwd) {
		mainMsg.textContent = "Enter Master Key to copy old password.";
		return;
	}

	// 1. Synthesize current password based on existing parameters
	const defaultCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-+=";
	let charset = allowedInput ? buildAllowedCharset(allowedInput) : defaultCharset;

	const hashBytes = wiseHash(masterPwd, websiteName + serial);
	let bigIntHash = BigInt(0);
	for (let i = 0; i < hashBytes.length; i++) {
		bigIntHash = (bigIntHash << 8n) + BigInt(hashBytes[i]);
	}

	const baseBI = BigInt(charset.length);
	let synthesized = "";
	while (bigIntHash > 0n) {
		synthesized = charset[Number(bigIntHash % baseBI)] + synthesized;
		bigIntHash /= baseBI;
	}

	const currentPwd = synthesized.slice(0, lengthInput);

	// 2. Use the scheduled clear logic for the old password
	await copyAndScheduleClear(currentPwd);
	mainMsg.textContent = "Old password copied! Now change serial for the new one.";
}

/**
 * Saves site-specific settings or deletes the record if it's empty.
 * Handles the '-' serial exclusion and triggers immediate UI updates.
 */
function saveHostData() {
    if (!websiteName) return;

    let serial = document.getElementById("serial").value.trim();
    // Legacy support: if serial is just '-', treat it as empty for storage.
    if (serial === '-') serial = ''; 

    const userID = document.getElementById("userID").value.trim();
    const length = document.getElementById("length-limit").value.trim();
    const allowed = document.getElementById("allowed-chars").value.trim();
    const classic = document.getElementById("classic-mode").checked;
    const vault = cryptoStr; // The current global ciphertext

    // Determine if the record is effectively empty.
    const isEffectivelyEmpty = !serial && !userID && !allowed && !vault && !classic && (length === "" || length === "44");

    if (isEffectivelyEmpty) {
        chrome.storage.sync.remove(websiteName, () => {
            console.log(`SynthPass 2: Cleared empty record for ${websiteName}`);
            updateVaultStatus(); // Clear the green highlight
        });
    } else {
        const data = {
            serial: serial,
            userID: userID,
            length: length,
            allowed: allowed,
            classic: classic,
            vault: vault
        };
        chrome.storage.sync.set({ [websiteName]: data }, () => {
            // Apply the green highlight immediately after saving
            updateVaultStatus();
        });
    }
}

/**
 * Fetches stored data and updates the global cryptoStr and UI highlight.
 */
function fetchStoredData(pageUserId) {
	if (!websiteName) return;

	chrome.storage.sync.get(websiteName, function (obj) {
		const data = obj[websiteName];
		
		if (!data) {
			cryptoStr = ''; // Reset global state if no record exists
			updateVaultStatus();
			return;
		}

		// Support legacy and modern formats
		const storedSerial = Array.isArray(data) ? data[0] : data.serial;
		const storedUser = Array.isArray(data) ? data[1] : data.userID;
		const rawLength = Array.isArray(data) ? data[2] : data.length;
		const storedAllowed = Array.isArray(data) ? "" : data.allowed;
		const storedClassic = Array.isArray(data) ? false : data.classic;

		const lengthEtc = (rawLength || "").toString().replace(/[+-]/g, '');

		if (storedSerial) document.getElementById("serial").value = storedSerial;
		if (storedClassic !== undefined) document.getElementById("classic-mode").checked = storedClassic;

		if (lengthEtc) {
			const numericLength = lengthEtc.replace(/[^0-9]/g, '');
			document.getElementById("length-limit").value = numericLength || "44";
			const legacyChars = lengthEtc.match(/[^0-9\s]/g)?.join('');
			document.getElementById("allowed-chars").value = storedAllowed || legacyChars || "";
		} else if (storedAllowed) {
			document.getElementById("allowed-chars").value = storedAllowed;
		}

		const userField = document.getElementById("userID");
		if (storedUser) {
			userField.value = storedUser;
		} else if (pageUserId) {
			userField.value = pageUserId;
		}

		// Assign the global secret
		cryptoStr = (Array.isArray(data) ? data[3] : data.vault) || '';
		
		// CRITICAL: Update the UI highlight now that cryptoStr is set
		updateVaultStatus();
	});
}

// 1. Storage Helpers (Adapted for flat .vault key)
async function getVaultPwd(host) {
	return new Promise((resolve) => {
		chrome.storage.sync.get(host, (data) => resolve(data?.[host]?.vault || null));
	});
}

async function setVaultPwd(host, encryptedPwd) {
	return new Promise((resolve) => {
		chrome.storage.sync.get(host, (data) => {
			const item = data[host] || {};
			item.vault = encryptedPwd || null; // Flat storage per user request
			chrome.storage.sync.set({ [host]: item }, resolve);
		});
	});
}

/**
 * Fixed: Updates global cryptoStr so saveHostData doesn't wipe the vault.
 */
async function handleVaultOptions(ciphertext, host) {
	const masterPwd = document.getElementById("m-pass")?.value.trim();
	try {
		const key = wiseHash(masterPwd, host);
		const decrypted = keyDecrypt(ciphertext, key);

		if (decrypted && confirm("Use stored password? (OK=use, Cancel=change/delete)")) {
			// CRITICAL: Sync the global state before saving
			cryptoStr = ciphertext; 
			cacheMasterKey(masterPwd);
			finalizeAndFill(decrypted);
		} else {
			showVaultPrompt(host);
		}
	} catch (e) {
		mainMsg.textContent = "Decryption failed. Check Master Key.";
	}
}

/**
 * Fixed: Ensures cryptoStr is updated before finalizeAndFill triggers a save.
 */
async function encryptAndStoreVaultPwd(plainPwd, host) {
	const masterPwd = document.getElementById("m-pass")?.value.trim();
	try {
		const key = wiseHash(masterPwd, host);
		const ciphertext = keyEncrypt(plainPwd, key);

		await setVaultPwd(host, ciphertext);
		
		// Update global state immediately
		cryptoStr = ciphertext;

		cacheMasterKey(masterPwd);
		finalizeAndFill(plainPwd);
	} catch (e) {
		mainMsg.textContent = "Error storing password.";
	}
}

/**
 * Deletes the stored vault password for the current host.
 * Matches the Privacy Bar's logic for record removal.
 */
async function deleteVaultPwd(host) {
	// Passing null to our helper effectively removes the entry from sync storage
	await setVaultPwd(host, null);

	// Update the global variable to reflect the deletion
	cryptoStr = '';

	// Provide immediate feedback to the user
	mainMsg.textContent = "Stored password deleted.";

	// Refresh the 'Stored password available' status
	await updateVaultStatus();
}

/**
 * Displays the prompt to store or delete a vault password.
 * Matches the Privacy Bar user interaction flow.
 */
function showVaultPrompt(host) {
	const pwd = prompt(
		"Enter password to store for this site.\nTo delete stored password, enter: DELETE"
	);

	// User clicked 'Cancel'
	if (pwd === null) return;

	// Handle the deletion keyword
	if (pwd.toUpperCase() === "DELETE") {
		deleteVaultPwd(host);
		return;
	}

	// Handle empty input
	if (pwd.trim() === "") {
		mainMsg.textContent = "Password not stored.";
		return;
	}

	// Proceed to encryption and storage
	encryptAndStoreVaultPwd(pwd, host);
}

/**
 * Updates the UI based on the current global cryptoStr.
 * Synchronous execution avoids race conditions on load.
 */
function updateVaultStatus() {
	const vaultBtn = document.getElementById("useVaultPwd");
	const statusEl = document.getElementById("mainMsg");

	if (!websiteName || !vaultBtn) return;

	if (cryptoStr) {
		const currentText = mainMsg.textContent;
		const actionMessages = ["Copied to clipboard (1 min).", "Filled successfully.", "Clipboard cleared.", "Old password copied!"];
		
		if (!currentText || !actionMessages.includes(currentText)) {
			mainMsg.textContent = "Stored password available.";
		}
		vaultBtn.classList.add("vault-active");
	} else {
		if (mainMsg.textContent === "Stored password available.") {
			mainMsg.textContent = "";
		}
		vaultBtn.classList.remove("vault-active");
	}
}

/**
 * Caches the Master Key and secures the UI.
 */
function cacheMasterKey(masterPwd) {
	if (!masterPwd) return;

	// 1. Persist to session storage and reset the auto-clear timer
	chrome.storage.session.set({ "masterPwd": masterPwd });
	chrome.alarms.create("SPAlarm", { delayInMinutes: 5 });

	// 2. Secure the UI input field
	const mpInput = document.getElementById("m-pass");
	if (mpInput) {
		mpInput.type = "password";
		const toggleIcon = document.getElementById("toggle-mpass");
		if (toggleIcon) toggleIcon.style.visibility = 'hidden';
	}
}

/**
 * Detects if password fields are present and updates the UI hint.
 */
function updateFieldDetectionHint(tabs) {
	chrome.tabs.sendMessage(tabs[0].id, { message: "check_fields" }, (response) => {
		const statusEl = document.getElementById("mainMsg");
		if (chrome.runtime.lastError || !response || !response.hasFields) {
			// No fields found: Prepare the user for clipboard fallback
			statusEl.textContent = "No fields found. Result will go to clipboard.";
			statusEl.classList.add("info-hint");
		} else {
			// Fields found: Normal operation
			updateVaultStatus();
		}
	});
}