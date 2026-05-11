/**
 * SynthPass
 * © 2026 Francisco Ruiz. All Rights Reserved.
 * * This source code is "Source-Available" for security auditing purposes only.
 * Redistribution, modification, or commercial use is strictly prohibited 
 * without explicit permission from the author.
 * * "Servers are Evil."
 */

/**
 * background.js - SynthPass 2 Service Worker
 */

// Handle Master Key cache expiration
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "SPAlarm") {
    chrome.storage.session.remove("masterPwd");
    console.log("SynthPass 2: Master Key cache cleared due to inactivity.");
  }
});