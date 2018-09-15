window.onload = function() {

	//button listeners
	okBtn.addEventListener('click', doStuff);					//execute the action
	okBtn.style.display = 'none';	
	row2.style.display = 'none';
	row3.style.display = 'none';
	row4.style.display = 'none';

	cancelBtn.addEventListener('click', function(){window.close()});		//quit

    helpBtn.addEventListener('click', function(){chrome.tabs.create({url: 'help.html'});});		//open tab with help items
	
	failMsg.addEventListener('click', fetchUserId);				//fetch userID anyway and display
	
	masterPwd1.addEventListener('keyup', pwdKeyup, false);		//display password strength and execute on Enter
	masterPwd2.addEventListener('keyup', pwdKeyup, false);
	masterPwd3.addEventListener('keyup', pwdKeyup, false);
	masterPwd4.addEventListener('keyup', pwdKeyup, false);
	userName.addEventListener('keyup', userKeyup, false);
	
	masterPwd1.addEventListener('focus', function(){var pwd = masterPwd1.value; if(pwd) keyStrength(pwd,true)}, false);
	masterPwd2.addEventListener('focus', function(){var pwd = masterPwd2.value; if(pwd) keyStrength(pwd,true)}, false);
	masterPwd3.addEventListener('focus', function(){var pwd = masterPwd3.value; if(pwd) keyStrength(pwd,true)}, false);
	masterPwd4.addEventListener('focus', function(){var pwd = masterPwd4.value; if(pwd) keyStrength(pwd,true)}, false);
	
	serial1.addEventListener('focus', function(){lastFocus = '1'},false);		//for storing the correct serial
	serial2.addEventListener('focus', function(){lastFocus = '2'},false);
	serial3.addEventListener('focus', function(){lastFocus = '3'},false);
	serial4.addEventListener('focus', function(){lastFocus = '4'},false);
	
	showPwdMode1.addEventListener('click', showPwd1);							//toggle visibility of the passwords
	showPwdMode2.addEventListener('click', showPwd2);
	showPwdMode3.addEventListener('click', showPwd3);
	showPwdMode4.addEventListener('click', showPwd4);

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {	//find the id of the current tab and tell script to count password boxes
    	activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, {"message": "start"});		//collect statistics from content script, also wake background page
	});
}