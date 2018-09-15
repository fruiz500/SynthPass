//deletes cached password after 5 minutes unless reset
chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {

			if(request.message == "reset_timer") resetPwdTimer();			//reset timer to erase cached Master Password
			
			if(request.message == "start") {									//wake up if the icon is clicked
				chrome.runtime.sendMessage({"message": "bg_here"})			//notify popup of availability
			}
      }
);

var bgPage = chrome.extension.getBackgroundPage(),
	pwdTimer = 0;
	
function resetPwdTimer(){
	clearTimeout(pwdTimer);
	pwdTimer = setTimeout(function(){
		bgPage.masterPwd = '';
	}, 300000)
}