// this script executes as soon as a page is loaded

//returns true if an element is hidden
function isHidden(el) {
    return (el.offsetParent === null)
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	 
    if( request.message === "start" ) {				//find password and text fields and send number of them to frontend, plus host name
		pwdId = [];										//global variables  that will be used later
		textId = [];

		var inputElements = document.querySelectorAll("input"),
			userDone = false;

		for(var i = 0; i < inputElements.length; i++){		//this is to avoid counting boxes that are on the page but not visible
			if(!isHidden(inputElements[i])){
				if(inputElements[i].type == 'password'){
					pwdId.push(inputElements[i])
					if(i > 0){								//detect single text or email input immediately before, skipping hidden inputs
						if(!userDone){
							var j = 1;
							while(isHidden(inputElements[i-j]) && j < i) j++;
							if(inputElements[i-j].type == 'text' || inputElements[i-j].type == 'email'){
							textId = [inputElements[i-j]];
							userDone = true
							}
						}
					}
				}
			}
		}

		//send data to the popup
   		chrome.runtime.sendMessage({"message": "start_info", "host": document.location.host, "number": pwdId.length, "isUserId": userDone})
    }
	
	if( request.message === "clicked_OK" ) {							//insert passwords coming from frontend into boxes
		var passwords = request.passwords;
		if(passwords){
			for(var i = 0; i < passwords.length; i++){
				pwdId[i].value = passwords[i];
			}
		}
		if(request.userName){
			if(passwords && textId[0]){
				textId[0].value = request.userName;			//insert user name
			}else{												//userId without pwd; find it and fill the last one
				textId = [];
				var inputElements = document.querySelectorAll("input[type='text'], input[type='email']");
				for(var i = 0; i < inputElements.length; i++){
					if(!isHidden(inputElements[i])){						//only visible fields
						textId.push(inputElements[i])
					}
				}
				if(textId[0]) textId[textId.length - 1].value = request.userName
			}
		}

		//tell the popup it can close
		chrome.runtime.sendMessage({"message": "done"})
	}
  }
)