/**
 * SynthPass
 * © 2026 Francisco Ruiz. All Rights Reserved.
 * * This source code is "Source-Available" for security auditing purposes only.
 * Redistribution, modification, or commercial use is strictly prohibited 
 * without explicit permission from the author.
 * * "Servers are Evil."
 */

/**
 * Core Crypto Utilities
 */

//Alphabets for base conversion. Used in making and reading the ezLock format
const base36 = "0123456789abcdefghijkLmnopqrstuvwxyz"; //capital L so it won't be mistaken for 1
const base64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeBase64(arr) {
  if (typeof btoa === 'undefined') {
    return (new Buffer(arr)).toString('base64');
  } else {
    var i, s = [], len = arr.length;
    for (i = 0; i < len; i++) s.push(String.fromCharCode(arr[i]));
    return btoa(s.join('')).replace(/=/g, ''); //removed padding
  }
};

function decodeBase64(s) {
  if (typeof atob === 'undefined') {
    return new Uint8Array(Array.prototype.slice.call(new Buffer(s, 'base64'), 0));
  } else {
    try {															//added because atob may fail
      var i, d = atob(s), b = new Uint8Array(d.length);
    } catch (error) {
      return false
    }
    for (i = 0; i < d.length; i++) b[i] = d.charCodeAt(i);
    return b;
  }
};

//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(string) {
  var entropy = entropyCalc(string),
    msg,
    colorName;

  if (entropy == 0) {
    msg = "This is a known bad Password!";
    colorName = "magenta";
  } else if (entropy < 20) {
    msg = "Terrible!";
    colorName = "magenta";
  } else if (entropy < 40) {
    msg = "Weak!";
    colorName = "red";
  } else if (entropy < 60) {
    msg = "Medium";
    colorName = "darkorange";
  } else if (entropy < 90) {
    msg = "Good!";
    colorName = "green";
  } else if (entropy < 120) {
    msg = "Great!";
    colorName = "blue";
  } else {
    msg = "Overkill  !!";
    colorName = "cyan";
  }

  var iter = Math.max(1, Math.min(20, Math.ceil(24 - entropy / 5))); //set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20

  return iter;
}

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropyCalc(string) {
  //find the raw Keyspace
  var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
  var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
  var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
  var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
  var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

  string = string.replace(/\s/g, ""); //no credit for spaces

  var Ncount = 0;
  if (numberRegex.test(string)) {
    Ncount = Ncount + 10;
  }
  if (smallRegex.test(string)) {
    Ncount = Ncount + 26;
  }
  if (capRegex.test(string)) {
    Ncount = Ncount + 26;
  }
  if (base64Regex.test(string)) {
    Ncount = Ncount + 2;
  }
  if (otherRegex.test(string)) {
    Ncount = Ncount + 31; //assume only printable characters
  }

  //start by finding words that might be on the blacklist (no credit)
  string = reduceVariants(string);
  var wordsFound = string.match(blackListExp); //array containing words found on the blacklist
  if (wordsFound) {
    for (var i = 0; i < wordsFound.length; i++) {
      string = string.replace(wordsFound[i], ""); //remove them from the string
    }
  }

  //now look for regular words on the wordlist
  wordsFound = string.match(wordListExp); //array containing words found on the regular wordlist
  if (wordsFound) {
    wordsFound = wordsFound.filter(function (elem, pos, self) {
      return self.indexOf(elem) == pos;
    }); //remove duplicates from the list
    var foundLength = wordsFound.length; //to give credit for words found we need to count how many
    for (var i = 0; i < wordsFound.length; i++) {
      string = string.replace(new RegExp(wordsFound[i], "g"), ""); //remove all instances
    }
  } else {
    var foundLength = 0;
  }

  string = string.replace(/(.+?)\1+/g, "$1"); //no credit for repeated consecutive character groups

  if (string != "") {
    return (
      (string.length * Math.log(Ncount) +
        foundLength * Math.log(wordLength + blackLength)) /
      Math.LN2
    );
  } else {
    return (foundLength * Math.log(wordLength + blackLength)) / Math.LN2;
  }
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string) {
  return string
    .toLowerCase()
    .replace(/[óòöôõo]/g, "0")
    .replace(/[!íìïîi]/g, "1")
    .replace(/[z]/g, "2")
    .replace(/[éèëêe]/g, "3")
    .replace(/[@áàäâãa]/g, "4")
    .replace(/[$s]/g, "5")
    .replace(/[t]/g, "7")
    .replace(/[b]/g, "8")
    .replace(/[g]/g, "9")
    .replace(/[úùüû]/g, "u");
}

const vowel = "aeiou";
const consonant = "bcdfghjklmnprstvwxyz";

//makes 'pronounceable' hash of a string, so user can be sure the password was entered correctly
function makeHashili(str) {
  const s = str.trim();
  if (!s) return "";

  const fullHash = nacl.hash(new TextEncoder().encode(s));
  const code = fullHash.slice(-2);
  let code10 = ((code[0] << 8) + code[1]) % 10000;

  let output = "";
  for (let i = 0; i < 2; i++) {
    const remainder = code10 % 100;
    output += consonant[Math.floor(remainder / 5)] + vowel[remainder % 5];
    code10 = Math.floor(code10 / 100);
  }
  return output; // e.g. "lomu"
}

//stretches a password string with a salt string to make a 256-bit Uint8Array Password
function wiseHash(string, salt, length) {
  var dkLen = length || 32,
    iter = keyStrength(string),
    secArray = new Uint8Array(dkLen),
    keyBytes;

  // Updated to the Options Object format
  scrypt(string, salt, {
    logN: iter, // Convert logN (e.g., 14) to literal N (16384)
    r: 8,
    p: 1,
    dkLen: dkLen
  }, function (x) {
    keyBytes = x;
  });

  // Assuming your library executes the callback synchronously
  for (var i = 0; i < dkLen; i++) {
    secArray[i] = keyBytes[i];
  }
  return secArray;
}

//makes a full 24-byte nonce from a short nonce (e.g. 16 bytes). Returns Uint8Array
function makeNonce24(shortNonce) {
  // Standard helper to pad a short nonce to 24 bytes for NaCl
  const fullNonce = new Uint8Array(24);
  fullNonce.set(shortNonce);
  return fullNonce;
}

//concatenates multiple Uint8Arrays into one. Input: array of Uint8Arrays. Output: single Uint8Array
function concatUi8(arrays) {
  // Filter out any undefined/null entries to prevent NaN length errors [cite: 2026-03-28]
  const validArrays = arrays.filter(a => a && (a instanceof Uint8Array || Array.isArray(a)));
  
  let totalLength = validArrays.reduce((acc, value) => acc + value.length, 0);
  let result = new Uint8Array(totalLength);
  let length = 0;
  for (let array of validArrays) {
    result.set(array, length);
    length += array.length;
  }
  return result;
}

// Implements k-mode (Symmetric Encryption for storage)

/**
 * Encrypts a string using a wiseHash-derived key and a 9-byte random nonce.
 * Uses native TextEncoder and custom encodeBase64.
 */
function keyEncrypt(plainText, key) {
    const nonce = nacl.randomBytes(9);
    const nonce24 = makeNonce24(nonce);
    
    // Convert string to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    
    // Encrypt payload
    const cipher = nacl.secretbox(data, nonce24, key);
    
    // Combine nonce and cipher using your internal utility
    const combined = concatUi8([nonce, cipher]);
    
    // Encode to Base64 using your custom function
    return encodeBase64(combined).replace(/=+$/, '');
}

/**
 * Decrypts a vault string. 
 * Throws an explicit error on failure to prevent UI errors.
 */
function keyDecrypt(ciphertext, key) {
    // Use your custom decodeBase64 function
    const cipher = decodeBase64(ciphertext);
    if (cipher.length < 9) throw new Error("Ciphertext too short.");
    
    const nonce = cipher.slice(0, 9);
    const nonce24 = makeNonce24(nonce);
    const payload = cipher.slice(9);
    
    const decrypted = nacl.secretbox.open(payload, nonce24, key);
    
    // Mandatory failure guard for cryptographers
    if (!decrypted) throw new Error("Match failed"); 
    
    // Convert bytes back to string using native browser API
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Modernized Base Converter using BigInt.
 * Handles padding for PassLok-specific lock lengths.
 */
function changeBase(numberIn, inAlpha, outAlpha, isLock) {
  const baseIn = BigInt(inAlpha.length);
  const baseOut = BigInt(outAlpha.length);
  let value = 0n;

  // 1. Convert input string to BigInt
  // We use for...of for cleaner iteration
  for (const char of numberIn) {
    const index = inAlpha.indexOf(char);
    if (index === -1) continue;
    value = value * baseIn + BigInt(index);
  }

  // 2. Short-circuit for zero
  if (value === 0n) return outAlpha[0].padStart(isLock ? (baseOut === 36n ? 50 : 43) : 1, outAlpha[0]);

  // 3. Convert BigInt to output string
  let result = "";
  while (value > 0n) {
    result = outAlpha[Number(value % baseOut)] + result;
    value /= baseOut;
  }

  // 4. Handle Lock padding using .padStart()
  if (isLock) {
    const lockLength = (baseOut === 36n) ? 50 : 43;   //32 bytes in base36 or base64
    return result.padStart(lockLength, outAlpha[0]);
  }

  return result;
}