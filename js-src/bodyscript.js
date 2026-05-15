/**
 * SynthPass
 * © 2026 Francisco Ruiz. All Rights Reserved.
 * * This source code is "Source-Available" for security auditing purposes only.
 * Redistribution, modification, or commercial use is strictly prohibited 
 * without explicit permission from the author.
 * * "Servers are Evil."
 */

window.onload = function () {

	mainMsg = document.getElementById("mainMsg");

	// Synthesis and Change actions
	document.getElementById('do-synth').addEventListener('click', function () { doStuff(); });
	document.getElementById('change-synth').addEventListener('click', changeSynth);

	helpBtn.addEventListener('click', function () { chrome.tabs.create({ url: '/html/help.html' }); });

	if (!masterPwd) {
		chrome.storage.session.get("masterPwd").then((result) => {
			if (result.masterPwd) {
				masterPwd = result.masterPwd;
				const mpInput = document.getElementById("m-pass");
				const toggleIcon = document.getElementById("toggle-mpass");

				if (mpInput) {
					mpInput.value = masterPwd;
					mpInput.type = "password";
				}

				if (toggleIcon) toggleIcon.style.visibility = 'hidden';

				const hashDisplay = document.getElementById('hashili-display');
				if (hashDisplay) hashDisplay.textContent = makeHashili(masterPwd);
			}
		});
	}

	//load content script programmatically (needs activeTab permission)
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {	//find the id of the current tab and tell script to count password boxes
		activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, { message: "send_data" }, function (response) {
			var lastError = chrome.runtime.lastError;
			if (lastError && lastError.message.includes("does not exist")) {								//no receiving end, so inject the script instead
				chrome.scripting.executeScript({
					target: { tabId: activeTab.id, allFrames: true },
					files: ["/js-src/content.js"]
				});
				return;
			}
		})

		//the rest in case there's no meaningful reply from the content script
		if (activeTab.url) {
			websiteURL = activeTab.url;
			var websiteParts = websiteURL.replace(/\/$/, '').split(':')[1].replace(/\/\//, '').split('?')[0].split('#')[0].split('.');
			if (websiteParts.length > 1) {
				if (websiteParts[websiteParts.length - 1].match(/htm|php/)) websiteParts = websiteParts.slice(0, websiteParts.length - 1);
				if (websiteParts.length > 1) {
					var websiteParts2 = websiteParts[websiteParts.length - 2].split('/'),
						websiteParts3 = websiteParts[websiteParts.length - 1].split('/');
					websiteName = websiteParts2[websiteParts2.length - 1] + '.' + websiteParts3[0]
				} else {
					websiteName = websiteParts[0]
				}
			} else {
				websiteName = websiteParts[0]
			}
		}
		var name = websiteName;
	})

	let hashiliTimer; // Persistent timer for the debounce logic

	document.getElementById('m-pass').addEventListener('input', function () {
		const val = this.value;
		const strengthFill = document.getElementById('strength-fill');
		const hashDisplay = document.getElementById('hashili-display');
		const toggleIcon = document.getElementById('toggle-mpass');

		// 1. Instant Cleanup: If field is empty, clear everything immediately
		if (val === '') {
			clearTimeout(hashiliTimer);
			toggleIcon.style.visibility = 'visible';
			strengthFill.style.width = '0%';
			hashDisplay.textContent = '';
			return;
		}

		// 2. Real-time Feedback: Update the Strength Bar immediately
		const strength = entropyCalc(val);
		strengthFill.style.width = Math.min(100, (strength / 120) * 100) + '%';
		strengthFill.style.background = strength < 40 ? '#ef4444' : (strength < 80 ? '#f59e0b' : '#10b981');

		// 3. Debounced Feedback: Update Hashili only after 1 second of no typing
		hashDisplay.textContent = "..."; // Optional: show a small hint that it's thinking
		clearTimeout(hashiliTimer);
		hashiliTimer = setTimeout(() => {
			hashDisplay.textContent = makeHashili(val);
		}, 1000);
	});

	document.getElementById('toggle-mpass').addEventListener('click', function () {
		const mpInput = document.getElementById('m-pass');
		const isPassword = mpInput.type === "password";
		mpInput.type = isPassword ? "text" : "password";
		mpInput.focus();
	});

	// Restore cached Master Key
	chrome.storage.session.get("masterPwd", (result) => {
		if (result.masterPwd) {
			const mpInput = document.getElementById('m-pass');
			mpInput.value = result.masterPwd;
			document.getElementById('toggle-mpass').style.visibility = 'hidden';

			// Trigger strength and hashili display for the cached key
			const event = new Event('input', { bubbles: true });
			mpInput.dispatchEvent(event);

			mainMsg.textContent = "Master Key active (5m cache).";
		}
	});

	// Vault Listener: Matches the Privacy Bar interaction flow
	document.getElementById("useVaultPwd").addEventListener("click", async () => {
		// Optional Pro check if you use the PB licensing engine
		if (window.checkProGate && !window.checkProGate()) return;

		if (!websiteName) {
			mainMsg.textContent = "No active host detected.";
			return;
		}

		const mpInput = document.getElementById("m-pass");
		const masterPwd = mpInput.value.trim();
		if (!masterPwd) {
			mainMsg.textContent = "Please enter Master Key first.";
			mpInput.focus();
			return;
		}

		const stored = await getVaultPwd(websiteName);
		if (stored) {
			handleVaultOptions(stored, websiteName);
		} else {
			showVaultPrompt(websiteName);
		}
	});

	// Change Listener: Saves current UI settings to storage without injecting
	document.getElementById("change-synth").addEventListener("click", () => {
		if (!websiteName) {
			mainMsg.textContent = "Navigate to a website first.";
			return;
		}

		saveHostData();
		mainMsg.textContent = "Settings updated for " + websiteName;

		// Briefly show the success message then clear it
		setTimeout(() => {
			mainMsg.textContent = cryptoStr ? "Stored password available." : "";
		}, 2000);
	});
}