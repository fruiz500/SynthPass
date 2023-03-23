chrome.alarms.onAlarm.addListener(function(result){
	if(result.name == "SPAlarm"){
		chrome.storage.session.remove("masterPwd");
	}
});

//this one for links by right-click
function openLink(info,tab){
	if(info.linkUrl) chrome.tabs.create({url: '../html/pagecage.html#' + info.linkUrl});
}

chrome.contextMenus.onClicked.addListener(openLink);

chrome.runtime.onInstalled.addListener(function(){
	chrome.contextMenus.create({
		id: "openInSynth",
		title: "Open Link in Cage",
		contexts:["selection"]
	});
})