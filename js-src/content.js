//returns true if an element is hidden
function isHidden(el) {
    return (el.offsetParent === null)
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {	
	if( request.message == "clicked_OK" ) {							//insert passwords coming from frontend into boxes
		var passwords = request.passwords;
		if(passwords){
			for(var i = 0; i < passwords.length; i++){
				pwdId[i].value = passwords[i];
				var inputEvent = new Event('input');
				pwdId[i].dispatchEvent(inputEvent);				//to simulate actual typing
				var keyupEvent = new Event('keyup');
				pwdId[i].dispatchEvent(keyupEvent)
			}
		}
		if(request.userID){
			if(passwords && textId[0]){
				textId[0].value = request.userID;			//insert user name
			}else{												//userId without pwd; find it and fill the last one
				textId = [];
				var inputElements = document.querySelectorAll("input[type='text'], input[type='email']");
				for(var i = 0; i < inputElements.length; i++){
					if(!isHidden(inputElements[i])){						//only visible fields
						textId.push(inputElements[i])
					}
				}
				if(textId[0]) textId[textId.length - 1].value = request.userID
			}
		}

		//tell the popup it can close
		chrome.runtime.sendMessage({message: "done"})
		
	}else if(request.message == "send_data"){						//data requested from a script already loaded
		sendData()
	}
  }
)

//the rest executes upon loading or per request
function sendData(){
	window.pwdId = [];										//global variables  that will be used later
	window.textId = [];

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
	chrome.runtime.sendMessage({message: "start_info", host: document.location.host, websiteURL: document.location.href, number: pwdId.length, isUserId: userDone})
}

//send data the fist time it loads
sendData()