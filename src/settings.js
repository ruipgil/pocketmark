function setLoginState() {
	document.querySelector("#login").classList.remove("hide");
	document.querySelector("#settings").classList.add("hide");
}
function setSettingsState() {
	document.querySelector("#login").classList.add("hide");
	document.querySelector("#settings").classList.remove("hide");
}
function setErrorMessage(message) {
	alert(message);
}
function loadSettingsValues() {
	storage.getAll(function(s) {
		document.querySelector("#loggedAs").innerText = s.username;
		document.querySelector("#tagToImport").value = s.tag;
		document.querySelector("#state").value = s.state;
		//update("#maxPmarks", s.count);
		//update("#sort", s.sort);
		//document.querySelector("#parentFolder").value = s.parent_folder;
		document.querySelector("#destinationFolder").value = s.target_folder;
		document.querySelector("#pocketOnSave").checked = !!Number(s.pocket_on_save);
		//document.querySelector("#interval").value = s.interval;
	});
}
var background = {
	start: function() {
		console.log("start");
		chrome.runtime.sendMessage({start:true});
	},
	stop: function() {
		console.log("stop");
		chrome.runtime.sendMessage({stop:true});
	},
	restart: function() {
		console.log("restart");
		chrome.runtime.sendMessage({restart:true});
	}
};

var validators = {
	isAlphaNum: function(val) {
		return /^[a-zA-Z0-9_]+$/g.test(val);
	},
	isState: function(val) {
		return val === Pocket.STATE.ALL || 
			val === Pocket.STATE.UNREAD || 
			val === Pocket.STATE.ARCHIVE;
	},
	isSort: function(val) {
		return val === Pocket.SORT.NEWEST ||
			val === Pocket.SORT.OLDEST ||
			val === Pocket.SORT.TITLE ||
			val === Pocket.SORT.SITE;
	},
	isInt: function(val) {
		return /^[0-9]+/g.test(val);
	},
	isFolder: function(val) {
		return true;
	}
};

var validate = function(params, callback) {
	for(var x in params) {
		params[x] = params[x].trim();
	}

	var vys = function(validators, value, message) {
		if(typeof validators !== "array") {
			validators = [validators];
		}
		for(var i=0, validator; i<validators.length; i++) {
			validator = validators[i];
			if(!validator(value)) {
				setErrorMessage(message || "");
				return false;
			}
		}
		return true;
	}

	if( vys(validators.isAlphaNum, params.tag, "Invalid tag. Use an alphanumeric tag.") &&
		vys(validators.isState, params.state, "Uhg, somethings wrong, and it may not be your fault. Please report an issue.") &&
		//vys(validators.isSort, params.sort) &&
		//vys(validators.isInt, params.max) &&
		//vys(validators.isInt, params.interval) &&
		//vys([validators.isFolder, validators.isAlphaNum], params.parent_folder) &&
		vys(validators.isAlphaNum, params.target_folder, "Invalid folder name. Use an alphanumeric name.") ) {
			storage.set({
				tag: params.tag,
				state: params.state,
				sort:params.sort,
				max: params.max,
				parent_folder: params.parent_folder,
				target_folder: params.target_folder,
				pocket_on_save: params.pocket_on_save
			}, callback);
	}

}

function onLoad() {
	var logingIn = false,
		saving = false;
	// bind click and changes
	document.querySelector("#loginBtn").addEventListener('click', function() {
		if(logingIn) {
			return;
		}
		logingIn = true;
		var temp = this.innerText,
			self = this;
		this.innerText = "Wait a second...";

		login(function(err) {
			logingIn = false;
			self.innerText = temp;
			if(err) {
				setErrorMessage("Login failed. Try again.");
			} else {
				background.start();
				loadSettingsValues();
				setSettingsState();
			}
		});
	});

	document.querySelector("#logout").addEventListener('click', function() {
		logout(function() {
			setLoginState();
			background.stop();
		});
	});
	document.querySelector("#save").addEventListener('click', function() {
		if(saving) {
			return;
		}
		saving = true;

		var temp = this.innerText,
			self = this;
		this.innerText = "Saving ...";

		validate({
			"tag": document.querySelector("#tagToImport").value,
			"state": document.querySelector("#state").value,
			//"sort": document.querySelector("#sort").value,
			//"max": document.querySelector("#maxPmarks").value,
			//"parent_folder": document.querySelector("#parentFolder").value,
			"target_folder": document.querySelector("#destinationFolder").value,
			"pocket_on_save": document.querySelector("#pocketOnSave").checked?"1":"0",
			//"interval": document.querySelector("#interval").value
		}, function() {
			loadSettingsValues();
			background.restart();
			saving = false;
			self.innerText = temp;
		});
	});

	/*document.querySelector("#interval").addEventListener('change', function() {
		document.querySelector("#intervalDescription").innerText = document.querySelector("#interval").value;
	});*/

	storage.get("access_token", function(value) {
		if(value) {
			setSettingsState();
			loadSettingsValues();
		}else{
			setLoginState();
		}
	});
}

document.addEventListener('DOMContentLoaded', onLoad);