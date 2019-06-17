// This is the main code for SynthPass

//global variables that will be used in computations
var websiteName, pwdNumber = 0, cryptoStr = '';

//gets executed with the OK button
function doStuff(e) {
	var pwdStr1 = masterPwd1.value.trim(),			//get passwords and serials
		serialStr1 = serial1.value.trim(),
		pwdStr2 = masterPwd2.value.trim(),
		serialStr2 = serial2.value,					//not trimmed so spaces mean "no serial" rather than "repeat serial"
		pwdStr3 = masterPwd3.value.trim(),
		serialStr3 = serial3.value,
		pwdStr4 = masterPwd4.value.trim(),
		serialStr4 = serial4.value,
		userStr = userName.value.trim(),
		lengthStr = pwdLength.value.replace(/ /g,'');
		
	if(pwdTable.style.display == 'block' && !pwdStr1 && row2.style.display == 'none'){		//no password in single box
		mainMsg.textContent = "Please enter something or click Cancel";
		return
	}else if(pwdNumber == 1 && serialStr1 == '-' && !cryptoStr){							//raw password to be used, send user back to webpage
		mainMsg.textContent = "If you do not want to synthesize the password, better to enter it directly on the webpage";
		serial1.value = '';
		return
	}
	
	//detect special in "length" box
	if(!lengthStr){												//default length is 44
		lengthStr = 44
	}else if(lengthStr.toLowerCase().match(/al/)){			//alphanumeric case
		var isAlpha = true;
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 44
		lengthStr = digits ? digits.join('') : 44
	}else if(lengthStr.toLowerCase().match(/pin|num/)){		//numeric case
		var isPin = true;
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 4
		lengthStr = digits ? digits.join('') : 4
	}else{															//general case, which may include special characters
		var spChars = lengthStr.match(/[^A-Za-z0-9]/g);			//detect special characters and add them to the alphabet
		if(spChars) base = base62 + spChars.join('');
		var digits = lengthStr.match(/[0-9]/g);					//extract digits, default is 44
		lengthStr = digits ? digits.join('') : 44
	}
	
	mainMsg.textContent = '';
	var blinker = document.createElement('span');
	blinker.className = "blink";
	blinker.textContent = 'PROCESSING';
	mainMsg.appendChild(blinker);
	
  setTimeout(function(){														//the rest after a 0 ms delay
	if(pwdTable.style.display == 'block'){					//do passwords if the boxes are displayed, otherwise, just userName
		var pwdOut = [],			//compute the new password into an array
			newPwd = pwdSynth(1,pwdStr1,serialStr1,isPin,isAlpha);
		if(!newPwd) return;								//bail out if just erasing stored password
		pwdOut.push(newPwd.slice(0,lengthStr));
	
	//fill missing inputs and compute the rest of the passwords
		if(pwdNumber > 1){
			if(!pwdStr2) pwdStr2 = pwdStr1;
			if(!serialStr2) serialStr2 = serialStr1;
			newPwd = (serial2.value == serial1.value) && (pwdStr2 == pwdStr1) && serialStr2 != '+' ? pwdOut[0] : pwdSynth(2,pwdStr2,serialStr2,isPin,isAlpha);
			pwdOut.push(newPwd.slice(0,lengthStr))
		}
		if(pwdNumber > 2){
			if(!pwdStr3) pwdStr3 = pwdStr2;
			if(!serialStr3) serialStr3 = serialStr2;
			newPwd = (serial3.value == serial2.value) && (pwdStr3 == pwdStr2) ? pwdOut[1] : pwdSynth(3,pwdStr3,serialStr3,isPin,isAlpha);
			pwdOut.push(newPwd.slice(0,lengthStr))
		}
		if(pwdNumber > 3){
			if(!pwdStr4) pwdStr4 = pwdStr3;
			if(!serialStr4) serialStr4 = serialStr3;
			newPwd = (serial4.value == serial3.value) && (pwdStr4 == pwdStr3) ? pwdOut[2] : pwdSynth(4,pwdStr4,serialStr4,isPin,isAlpha);
			pwdOut.push(newPwd.slice(0,lengthStr))
		}
	  }
		//send new passwords to page
		if(userTable.style.display == 'block'){
    		chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_OK", "passwords": pwdOut, "userName": userStr})
		}else{
			chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_OK", "passwords": pwdOut})
		}
		
		setTimeout(function(){				//close window after 2 seconds in case the content script does not reply
		  window.close();
	  	}, 2000)
  },0);
}

//synthesizes a new password, or stores and retrieves one provided by user
function pwdSynth(boxNumber, pwd, serial, isPin, isAlpha){
	if(!pwd){
		mainMsg.textContent = "Please write your Master Password";
		return
	}
	if(serial == '-'){						//special case to delete stored password, and using Master Password directly in a change password case
		if(!confirm("A dash in the serial box tells me that you want to erase a stored password. Click OK if this is what you want.")) return false;
		cryptoStr = '';					//reset stored password
		serial = '';
		serial1.value = ''; serial2.value = '';serial3.value = ''; serial4.value = '';
		var userStr = userName.value.trim(),
			lengthStr = pwdLength.value.trim(),
			jsonfile = {};
		jsonfile[websiteName] = [serial,userStr,lengthStr,cryptoStr];		//and now erase from storage
    	chrome.storage.sync.set(jsonfile);
		mainMsg.textContent = "The stored password has been deleted";
		if(pwdNumber == 1){
			return false
		}else{
			return pwd						//keep going is this is part of a password change
		}
	}else if(serial == '+'){						//use stored password				
		if(cryptoStr && (boxNumber == 1 || !document.getElementById('serial' + boxNumber).value)){						//already stored in encrypted form: decrypt it
			var cipher = nacl.util.decodeBase64(cryptoStr),
				nonce = cipher.slice(0,9),												//no marker byte
				nonce24 = makeNonce24(nonce),
				cipher2 = cipher.slice(9),
				KeyDir = wiseHash(pwd,websiteName),
				plain = nacl.secretbox.open(cipher2,nonce24,KeyDir);
			if(plain){
				return nacl.util.encodeUTF8(plain)
			}else{
				mainMsg.textContent = "Decryption of stored password has failed"
				return false
			}
		}else{								//not stored or these are extra boxes, so ask for it, encrypt it, to be saved at the end
			var plainStr = prompt("Please enter a password to remember for this website");
			if(!plainStr){
				mainMsg.textContent = "Password store canceled";
				return false
			}else{																	//encrypt user-supplied password
				var	nonce = nacl.randomBytes(9),
					nonce24 = makeNonce24(nonce),
					plain =	 nacl.util.decodeUTF8(plainStr),
					KeyDir = wiseHash(pwd,websiteName),
					cipher = nacl.secretbox(plain,nonce24,KeyDir);
				cryptoStr = nacl.util.encodeBase64(concatUint8Arrays(nonce,cipher)).replace(/=+$/,'')
				return plainStr
			}
		}
	//the rest of the options are synthesized through wiseHash
		
	}else if(isPin){				//return only decimal digits, with equal probability
		cryptoStr = '';
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial.trim())).replace(/[AaBbC]/g,'0').replace(/[cDdEe]/g,'1').replace(/[FfGgH]/g,'2').replace(/[hIiJj]/g,'3').replace(/[KkLlM]/g,'4').replace(/[mNnOo]/g,'5').replace(/[PpQqR]/g,'6').replace(/[rSsTt]/g,'7').replace(/[UuVvW]/g,'8').replace(/[wXxYy]/g,'9').match(/[0-9]/g).join('')
	}else if(isAlpha){						//replace extra base64 characters with letters
		cryptoStr = '';
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial.trim())).replace(/\+/g,'a').replace(/\//g,'b').replace(/=/,'c')
	}else{
		cryptoStr = '';
		if(base == base62){				//replace some base64 characters with default special characters
			return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial.trim())).replace(/[+/=Aa]/g,'_').replace(/[BbCc]/,'!').replace(/[DdEe]/,'#')
		}else{								//change base in order to include the special characters, with equal probability
			return base.charAt(62) + changeBase(nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial.trim())).replace(/=$/g,''), base64, base) 				//use at least the first of the characters on the list
		}
	}
}

var bgPage = chrome.extension.getBackgroundPage();			//to cache the master password

//what happens when the content script sends something back
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  
	if( request.message === "start_info" ) {							//initial message
	  var hostParts = request.host.split('.');						//get name of the website, ignoring subdomains
	  if(hostParts[hostParts.length - 1].length == 2 && hostParts[hostParts.length - 2].length < 4){			//domain name with second-level suffix
		  	websiteName = hostParts.slice(-3).join('.')
	  }else{
	  		websiteName = hostParts.slice(-2).join('.')				//normal domain name
	  }
	  pwdNumber = Math.max(pwdNumber,request.number);
	  isUserId = request.isUserId	;
	  
	  if(isUserId){								//userId field found, so display box, filled from storage
	  		userTable.style.display = 'block';
			okBtn.style.display = '';
			mainMsg.textContent = "I cannot see a password to be filled, but there is an input that might take a user name"
	  }
			
	  if(pwdNumber){					             //password boxes found, so display the appropriate areas and load serial into first box
		  pwdTable.style.display = 'block';
		  userTable.style.display = 'block';
		  if(!isUserId){idLabel.style.display = 'none';userName.style.display = 'none';}		//don't display user ID box if no inputs
		  okBtn.style.display = '';
		  bgPage = chrome.extension.getBackgroundPage();
		  var prevPwd = bgPage.masterPwd;
		  if(prevPwd){													//populate cached Master Password
				showPwdMode1.style.display = 'none';
				masterPwd1.value = prevPwd;	
		  }
		  if(pwdNumber == 1){						//only one password box: display single input
		  	  if(prevPwd){
				  mainMsg.textContent = "Master Password still active; click OK"
			  }else{
				  mainMsg.textContent = "Enter Master Password and optional serial, click OK"
			  }
		  }else if(pwdNumber >= 2){				//2 password boxes: display two inputs and load serial on top box	  
			  mainMsg.textContent = "Move the serial if the old password is not first. To take password as-is, write a dash as serial";
			  row2.style.display = '';
			  if(pwdNumber >= 3){					//3 boxes
				  row3.style.display = '';
				  if(pwdNumber == 4){				//4 boxes, which is the max
					  row4.style.display = '';
				  }else if(pwdNumber >= 5){		//too many boxes
					  pwdTable.style.display = 'none';
		  			  okBtn.style.display = 'none';
					  mainMsg.textContent = "Too many password fields. Try filling them manually";
				  }
			  }	  
		  }
		  masterPwd1.focus()
	  }

	  //now get the serial from storage, and put it in the first serial box, and the userName in its place
	  chrome.storage.sync.get(websiteName, function (obj){
		var serialData = obj[websiteName];
		if(serialData){
			if(serialData[0]) serial1.value = serialData[0];			//populate serial box
			if(serialData[1]) userName.value = serialData[1];		//and user ID regardless of whether it is displayed
			if(serialData[2]) pwdLength.value = serialData[2];		//and password length, if any
			if(serialData[3]) cryptoStr = serialData[3];				//put encrypted password, if any, in global variable
		}
	  });
	  
	  //close everything and erase cached Master Password after five minutes
	  setTimeout(function(){
		  bgPage.masterPwd = '';
		  window.close();
	  }, 300000)
    }

 	if( request.message === "done" ) {				//done, so store the serial, if any, of the password that has focus, plus the user name
    	var	serialStr = document.getElementById("serial" + lastFocus).value.trim(),
			userStr = userName.value.trim()
			lengthStr = pwdLength.value.trim();
		if(serialStr == '-') serialStr = '';										//don't store '-' serial
		
		if(serialStr == '' && userStr == '' && lengthStr == ''){					//delete entry if empty
			chrome.storage.sync.remove(websiteName);
		}else{													//otherwise store serial, user name, password length, and encrypted password, if any
			var jsonfile = {};
			jsonfile[websiteName] = [serialStr,userStr,lengthStr,cryptoStr];
    		chrome.storage.sync.set(jsonfile)
		}

		var	pwdStr = document.getElementById("masterPwd" + lastFocus).value;
		if(pwdStr){
			bgPage = chrome.extension.getBackgroundPage();
			bgPage.masterPwd = pwdStr;					//store master password between popup loads; auto timer is set in bodyscript.js
			bgPage.pwdTime = new Date().getTime();
			chrome.runtime.sendMessage({"message": "reset_timer"})			//reset auto timer on background page
		}

		window.close()
	}
  }
)


//fetches userId and displays in box so it can be added
function fetchUserId(){
	userTable.style.display = 'block';
	lengthLabel.style.display = 'none';
	pwdLength.style.display = 'none';
	okBtn.style.display = '';
	mainMsg.textContent = "There was no user ID stored";

	//now get the userName from storage, and put it in its place
	chrome.storage.sync.get(websiteName, function (obj){
		var serialData = obj[websiteName];
		if(serialData){
			if(serialData[1]) userName.value = serialData[1]		//fill user ID
		}
		mainMsg.textContent = "Click OK to put it in the page"
	})
}

var hashiliOn = false;			//default to not showing hashili


//this for showing and hiding text in the Password boxes
function showPwd(number){
	var pwdEl = document.getElementById('masterPwd' + number),
		imgEl = document.getElementById('showPwdMode' + number);
	if(pwdEl.type == "password"){
		pwdEl.type = "text";
		imgEl.src = "images/hide-24.png"
	}else{
		pwdEl.type = "password";
		imgEl.src = "images/eye-24.png"
	}
}

var lastFocus = '1';			//default is first row

//displays Keys strength and executes on Enter
function pwdKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar,
		pwdEl = document.activeElement;
	lastFocus = pwdEl.id.slice(-1);					//get last focused row
	if(!pwdEl.value){									//display Show label and checkbox if empty (hidden for cached password)
		showPwdMode1.style.display = ''
	}
	if(key == 13){doStuff()} else{
		 if(pwdEl.value.trim()){
			 keyStrength(pwdEl.value,true,false)
		 }else{
			 mainMsg.textContent = "Please enter the Master Key";
			 mainMsg.style.color = '';
			 hashili('mainMsg','')
		 }
	}
}
function userKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13) doStuff()
}

//makes 'pronounceable' hash of a string, so user can be sure the password was entered correctly
var vowel = 'aeiou',
	consonant = 'bcdfghjklmnprstvwxyz',
	hashiliTimer;
function hashili(msgID,string){
	var element = document.getElementById(msgID);
	clearTimeout(hashiliTimer);
	hashiliTimer = setTimeout(function(){
		if(!string.trim()){
			element.innerText += ''
		}else{
			var code = nacl.hash(nacl.util.decodeUTF8(string.trim())).slice(-2),			//take last 4 bytes of the SHA512		
				code10 = ((code[0]*256)+code[1]) % 10000,		//convert to decimal
				output = '';

			for(var i = 0; i < 2; i++){
				var remainder = code10 % 100;								//there are 5 vowels and 20 consonants; encode every 2 digits into a pair
				output += consonant[Math.floor(remainder / 5)] + vowel[remainder % 5];
				code10 = (code10 - remainder) / 100
			}
//	return output
			element.textContent += '\r\n' + output
		}
	}, 1000);						//one second delay to display hashili
}

//stretches a password string with a salt string to make a 256-bit Uint8Array Key
function wiseHash(pwd,salt){
	var iter = keyStrength(pwd,false),
		secArray = new Uint8Array(32),
		keyBytes;

	scrypt(pwd,salt,iter,8,32,0,function(x){keyBytes=x;});		//does a variable number of rounds of scrypt, using nacl libraries

	for(var i=0;i<32;i++){
			secArray[i] = keyBytes[i]
	}
	return secArray
}

//stretches nonce to 24 bytes. The rest is left undefined
function makeNonce24(nonce){
	var	result = new Uint8Array(24);
	for(i = 0; i < nonce.length; i++){result[i] = nonce[i]}
	return result
}

//concatenates two uint8 arrays, normally used right before displaying the output
function concatUint8Arrays(array1,array2){
	var result = new Uint8Array(array1.length + array2.length);
	result.set(array1,0);
	result.set(array2,array1.length);
	return result
}

//The rest is modified from WiseHash. https://github.com/fruiz500/whisehash
//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(pwd,display,isHelp) {
	if(pwd){
		var entropy = entropycalc(pwd);
	}else{
		mainMsg.textContent = 'Type your Master Password in the box';
		return
	}
	
  if(display){
	if(entropy == 0){
		var msg = 'This is a known bad password!';
		var colorName = 'magenta'
	}else if(entropy < 20){
		var msg = 'Terrible!';
		var colorName = 'magenta'
	}else if(entropy < 40){
		var msg = 'Weak!';
		var colorName = 'red'
	}else if(entropy < 60){
		var msg = 'Medium';
		var colorName = 'darkorange'
	}else if(entropy < 90){
		var msg = 'Good!';
		var colorName = 'green'
	}else if(entropy < 120){
		var msg = 'Great!';
		var colorName = 'blue'
	}else{
		var msg = 'Overkill  !';
		var colorName = 'cyan'
	}
  }

	var iter = Math.max(1,Math.min(20,Math.ceil(24 - entropy/5)));			//set the scrypt iteration exponent based on entropy: 1 for entropy >= 120, 20(max) for entropy <= 20
		
	msg = 'entropy ' + Math.round(entropy*100)/100 + ' bits. ' + msg;
	
	if(display){
		if(isHelp){
			helpMsg.textContent = msg;
			helpMsg.style.color = colorName;
			hashili('helpMsg',pwd)			
		}else{
			mainMsg.textContent = msg;
			mainMsg.style.color = colorName;
			hashili('mainMsg',pwd)
		}
	}
	return iter
};

//takes a string and calculates its entropy in bits, taking into account the kinds of characters used and parts that may be in the general wordlist (reduced credit) or the blacklist (no credit)
function entropycalc(pwd){

//find the raw Keyspace
	var numberRegex = new RegExp("^(?=.*[0-9]).*$", "g");
	var smallRegex = new RegExp("^(?=.*[a-z]).*$", "g");
	var capRegex = new RegExp("^(?=.*[A-Z]).*$", "g");
	var base64Regex = new RegExp("^(?=.*[/+]).*$", "g");
	var otherRegex = new RegExp("^(?=.*[^a-zA-Z0-9/+]).*$", "g");

	pwd = pwd.replace(/\s/g,'');										//no credit for spaces

	var Ncount = 0;
	if(numberRegex.test(pwd)){
		Ncount = Ncount + 10;
	}
	if(smallRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(capRegex.test(pwd)){
		Ncount = Ncount + 26;
	}
	if(base64Regex.test(pwd)){
		Ncount = Ncount + 2;
	}
	if(otherRegex.test(pwd)){
		Ncount = Ncount + 31;											//assume only printable characters
	}

//start by finding words that might be on the blacklist (no credit)
	var pwd = reduceVariants(pwd);
	var wordsFound = pwd.match(blackListExp);							//array containing words found on the blacklist
	if(wordsFound){
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(wordsFound[i],'');						//remove them from the string
		}
	}

//now look for regular words on the wordlist
	wordsFound = pwd.match(wordListExp);									//array containing words found on the regular wordlist
	if(wordsFound){
		wordsFound = wordsFound.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});	//remove duplicates from the list
		var foundLength = wordsFound.length;							//to give credit for words found we need to count how many
		for(var i = 0; i < wordsFound.length;i++){
			pwd = pwd.replace(new RegExp(wordsFound[i], "g"),'');									//remove all instances
		}
	}else{
		var foundLength = 0;
	}

	pwd = pwd.replace(/(.+?)\1+/g,'$1');								//no credit for repeated consecutive character groups

	if(pwd != ''){
		return (pwd.length*Math.log(Ncount) + foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}else{
		return (foundLength*Math.log(wordLength + blackLength))/Math.LN2
	}
}

//take into account common substitutions, ignore spaces and case
function reduceVariants(string){
	return string.toLowerCase().replace(/[óòöôõo]/g,'0').replace(/[!íìïîi]/g,'1').replace(/[z]/g,'2').replace(/[éèëêe]/g,'3').replace(/[@áàäâãa]/g,'4').replace(/[$s]/g,'5').replace(/[t]/g,'7').replace(/[b]/g,'8').replace(/[g]/g,'9').replace(/[úùüû]/g,'u');
}

//for cases with user-specified special characters
var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
	base62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
	base = base62;

//from http://snippetrepo.com/snippets/bignum-base-conversion, by kybernetikos
function changeBase(number, inAlpha, outAlpha) {
	var targetBase = outAlpha.length,
		originalBase = inAlpha.length;
    var result = "";
    while (number.length > 0) {
        var remainingToConvert = "", resultDigit = 0;
        for (var position = 0; position < number.length; ++position) {
            var idx = inAlpha.indexOf(number[position]);
            if (idx < 0) {
                throw new Error('Symbol ' + number[position] + ' from the'
                    + ' original number ' + number + ' was not found in the'
                    + ' alphabet ' + inAlpha);
            }
            var currentValue = idx + resultDigit * originalBase;
            var remainDigit = Math.floor(currentValue / targetBase);
            resultDigit = currentValue % targetBase;
            if (remainingToConvert.length || remainDigit) {
                remainingToConvert += inAlpha[remainDigit];
            }
        }
        number = remainingToConvert;
        result = outAlpha[resultDigit] + result;
    }
    return result;
}