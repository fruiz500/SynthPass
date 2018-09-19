//for opening one item at a time in the Help screen
function openHelp(theID){
	var helpItems = document.getElementsByClassName('helptext');	//hide all help texts
	for(var i=0; i < helpItems.length; i++){
		helpItems[i].style.display = 'none'
	}
	document.getElementById(theID).style.display = "block";		//except for the one clicked

	if(typeof window.orientation != 'undefined'){					//scroll to the item on Mobile
		location.href = '#';
		location.href = '#a' + theID;
	}
	outputBox.textContent = ''							//delete password displayed here, for good measure
}

//for showing and hiding text in the Password box
function showPwd(){
	if(showPwdMode.checked){
		masterPwd.type = "text"
	}else{
		masterPwd.type = "password"
	}
}

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

var websiteName;							//global in the popup, so global here also

//this part of the code is to synthesize passwords using the fields in the last Help item
function doStuff(e) {
	websiteName = siteName.value.toLowerCase();			//get all the data
	var	pwdStr = masterPwd.value,	
		serialStr = serial.value;
		
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
	helpMsg.innerHTML = '<span class="blink">PROCESSING</span>';				//Get blinking message started
	
	setTimeout(function(){														//the rest after a 10 ms delay
		helpMsg.textContent = "Password synthesized. Copy it now";
		outputBox.textContent = pwdSynth(pwdStr,serialStr);
		masterPwd.value = '';
		siteName.value = '';
		websiteName = '';
		serial.value = '';
	},10);
}

//synthesizes a new password
function pwdSynth(pwd, serial){
	if(serial == '-'){
		helpMsg.textContent = "This serial is not allowed here"
		return
	}else{							//the replaces are to add generally accepted special characters
		return nacl.util.encodeBase64(wiseHash(pwd,websiteName + serial)).replace(/[+/=Aa]/g,'_').replace(/[BbCc]/,'!').replace(/[DdEe]/,'#')
	}
}

//to display password strength
function pwdKeyup(evt){
	evt = evt || window.event;
	var key = evt.keyCode || evt.which || evt.keyChar;
	if(key == 13){doStuff()} else{
		 return keyStrength(masterPwd.value,true)
	}
}

//displays output password length
function outputKeyup(){
	helpMsg.textContent = "Output is " + outputBox.textContent.length + " characters long"
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

//The rest is modified from WiseHash. https://github.com/fruiz500/whisehash
//function to test key strength and come up with appropriate key stretching. Based on WiseHash
function keyStrength(pwd,display) {
	if(pwd){
		var entropy = entropycalc(pwd);
	}else{
		document.getElementById('helpMsg').textContent = 'Type your Master Password in the box';
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
		var colorName = 'orange'
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
		helpMsg.innerHTML = "<span id='pwdMsg'>" + msg + "</span>";
		document.getElementById('pwdMsg').style.color = colorName;
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

//add event listeners
window.onload = function() {
	var helpHeaders = document.getElementsByClassName("helpitem");		//add listeners to all the help headers

	for (var i = 0; i < helpHeaders.length; i++) {
		helpHeaders[i].addEventListener('click', function(){openHelp(this.id.slice(1))});
	}
	
	okBtn.addEventListener('click', doStuff);								//execute
	showPwdMode.addEventListener('click', showPwd);
	copyBtn.addEventListener('click', copyOutput);
	
	masterPwd.addEventListener('keyup', pwdKeyup, false);
	outputBox.addEventListener('keyup', outputKeyup, false)
}