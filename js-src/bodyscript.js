window.onload = function() {

	//button listeners
	okBtn.addEventListener('click', function(){doStuff(false)});				//execute the action. No clipboard copy
	row2.style.display = 'none';
	row3.style.display = 'none';
	row4.style.display = 'none';

	clipbdBtn.addEventListener('click', function(){doStuff(true)});			//same as above, but set a flag so result is copied to clipboard as well

	cancelBtn.addEventListener('click', function(){window.close()});		//quit

    helpBtn.addEventListener('click', function(){chrome.tabs.create({url: '/html/help.html'});});		//open tab with help items
	
	failMsg.addEventListener('click', fetchUserId);				//fetch userID anyway and display

	showPwdMode1.addEventListener('click', function(){showPwd('1')});				//toggle visibility of the passwords
	showPwdMode2.addEventListener('click', function(){showPwd('2')});
	showPwdMode3.addEventListener('click', function(){showPwd('3')});
	showPwdMode4.addEventListener('click', function(){showPwd('4')});
	
	for(var i = 1; i < 4; i++){
		document.getElementById('masterPwd' + i.toString()).addEventListener('keyup', pwdKeyup);
		document.getElementById('masterPwd' + i.toString()).addEventListener('focus', function(){var master = masterPwd1.value; if(master) keyStrength(master,true)});
		document.getElementById('serial' + i.toString()).addEventListener('focus', function(){lastFocus = i.toString()})
	}
	
	cancelExtraMasterBtn.addEventListener('click',cancelextraMaster);
	acceptExtraMasterBtn.addEventListener('click',acceptextraMaster);
	extraMasterIcon.addEventListener('click',function(){showPwd('extraMaster')});
	extraMasterBox.addEventListener('keyup',extraMasterKeyup);

	cageBtn.addEventListener('click',function(){
		if(typeof(websiteURL) == 'undefined'){
			chrome.tabs.create({url: '/html/pagecage.html'})
		}else{
			chrome.tabs.create({url: '/html/pagecage.html#' + websiteURL.split("?")[0]});		//remove query as well
		}
		chrome.tabs.remove(activeTab.id);															//close current tab
		chrome.history.deleteUrl({url: activeTab.url})
	});

	if(!masterPwd){															//get master pwd from session storage
		let gettingPwd = chrome.storage.session.get("masterPwd");		//this is a Promise
		gettingPwd.then(function(result){
			if(result["masterPwd"]){
				masterPwd = result["masterPwd"];
				masterPwd1.value = masterPwd;
				showPwdMode1.style.display = 'none'
			}
		})
	} 

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {	//find the id of the current tab and tell script to count password boxes
    	activeTab = tabs[0];

//load content script programmatically (needs activeTab permission)
		chrome.scripting.executeScript({
			target: {tabId: activeTab.id, allFrames: true},
			files: ["/js-src/content.js"]
		});

//the rest in case there's no meaningful reply from the content script
		if(activeTab.url){
			websiteURL = activeTab.url;
			var websiteParts = websiteURL.replace(/\/$/,'').split(':')[1].replace(/\/\//,'').split('?')[0].split('#')[0].split('.');
			if(websiteParts.length > 1){
				if(websiteParts[websiteParts.length - 1].match(/htm|php/)) websiteParts = websiteParts.slice(0,websiteParts.length - 1);
				if(websiteParts.length > 1){
					var	websiteParts2 = websiteParts[websiteParts.length - 2].split('/'),
						websiteParts3 = websiteParts[websiteParts.length - 1].split('/');
					websiteName = websiteParts2[websiteParts2.length - 1] + '.' + websiteParts3[0]
				}else{
					websiteName = websiteParts[0]
				}
			}else{
				websiteName = websiteParts[0]
			}
		}
		var name = websiteName;
		startTimer = setTimeout(function(){showMemo(name)},1000)
	})
}
