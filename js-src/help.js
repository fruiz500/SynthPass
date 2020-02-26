//to select the result
function copyOutput(){
  if(outputBox.textContent.trim() != ''){
    var range, selection;
    if(document.body.createTextRange){
        range = document.body.createTextRange();
        range.moveToElementText(outputBox);
        range.select()
    }else if (window.getSelection){
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(outputBox);
        selection.removeAllRanges();
        selection.addRange(range)
    }
	document.execCommand('copy');
	outputBox.textContent = '';
	helpMsg.textContent = "Output copied to clipboard"
  }
}

//this part of the code is to synthesize passwords using the fields in the last Help item
function doStuffHelp(e) {
	websiteName = siteName.value.toLowerCase();			//get all the data
	var	pwdStr = masterPwdHelp.value,	
		serialStr = serial.value,
		lengthStr = pwdLength.value.replace(/ /g,'');
		
	if(!pwdStr){																//no password in box
		helpMsg.textContent = "Please enter your master Password";
		return
	}
	if(!websiteName){																//no website in box
		helpMsg.textContent = "Please enter the website name as name.suffix or name.suffix.countryID";
		return
	}
	var websiteParts = websiteName.split('.');
	if(websiteParts.length != 2 && !(websiteParts.length == 3 && websiteParts[2].length == 2)){
		helpMsg.textContent = "The website name should contain only two or three pieces of text with dots between them";
		return
	}
	if(websiteParts.length == 3 && websiteParts[1].length > 3) websiteName = websiteParts.slice(-2).join('.'); //correction for long STL

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

	helpMsg.textContent = '';
	var blinker = document.createElement('span');
	blinker.className = "blink";
	blinker.textContent = 'PROCESSING';
	helpMsg.appendChild(blinker);
	
	setTimeout(function(){														//the rest after a 10 ms delay
		helpMsg.textContent = "Password synthesized. Copy it now";
		outputBox.textContent = pwdSynth(2,pwdStr,serialStr,isPin,isAlpha).slice(0,lengthStr);
		masterPwdHelp.value = '';
		siteName.value = '';
		websiteName = '';
		pwdLength.value = '';
		serial.value = '';
	},10);
}

//to display password strength
function pwdKeyupHelp(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){doStuff()} else{
		 if(masterPwdHelp.value){
			 keyStrength(masterPwdHelp.value,true,true)
		 }else{
			 helpMsg.textContent = "Please enter the Master Password"
		 }
	}
}

//displays output password length
function outputKeyup(){
	helpMsg.textContent = "Output is " + outputBox.textContent.length + " characters long"
}

//for opening one item at a time in the Help screen, with animation
function openHelp(){
	var helpItems = document.getElementsByClassName('helpitem');
	for(var i = 0; i < helpItems.length; i++){					//hide all help texts
		var panel = helpItems[i].nextElementSibling;
		panel.style.maxHeight = null;
	}
	var panel = this.nextElementSibling;							//except for the one clicked
	panel.style.maxHeight = panel.scrollHeight + "px"	     
}

//add event listeners
window.onload = function() {
	var helpHeaders = document.getElementsByClassName("helpitem");		//add listeners to all the help headers
	for (var i = 0; i < helpHeaders.length; i++) {
		helpHeaders[i].addEventListener('click', openHelp);
	}
	
	document.body.style.backgroundColor = 'white';
	okBtn.addEventListener('click', doStuffHelp);								//execute
	showPwdModeHelp.addEventListener('click', function(){showPwd('Help')});
	copyBtn.addEventListener('click', copyOutput);
	
	masterPwdHelp.addEventListener('keyup', pwdKeyupHelp, false);
	outputBox.addEventListener('keyup', outputKeyup, false)
}