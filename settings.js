var pocket_options = {
	// tag to look for
	tag: "bookmark",
	// states to look for
	state: "all",
	// number of pocketmarks to get
	count: undefined,
	// sorting
	sort: "newest"
};
// pocketmark's own setup options
var pmarks_options = {
	// folder to insert the folder
	parent_folder: "1",
	// folder name
	target_folder: "pocketmark",
	// one minute
	interval: 1
}
var pocket_options_map = {
		tag: "tagToImport",
		state: "state",
		count: "maxPmarks",
	},
	pmarks_options_map = {
		//parent_folder: "parentFolder",
		target_folder: "destinationFolder",
		interval: "interval"
	};


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
	document.querySelector("#loggedAs").innerText = storage.get("username");
	document.querySelector("#tagToImport").value = storage.get("tag");
	document.querySelector("#state").value = storage.get("state");
	//update("#maxPmarks", storage.get("count"));
	//update("#sort", storage.get("sort"));
	//document.querySelector("#parentFolder").value = storage.get("parent_folder");
	document.querySelector("#destinationFolder").value = storage.get("target_folder");
	//document.querySelector("#interval").value = storage.get("interval");
}

var validators = {
	isAlphaNum: function(val) {
		return /^[a-zA-Z0-9_]+$/g.test(val);
	},
	isState: function(val) {
		return val === POCKET.STATE.ALL || 
			val === POCKET.STATE.UNREAD || 
			val === POCKET.STATE.ARCHIVE;
	},
	isSort: function(val) {
		return val === POCKET.SORT.NEWEST ||
			val === POCKET.SORT.OLDEST ||
			val === POCKET.SORT.TITLE ||
			val === POCKET.SORT.SITE;
	},
	isInt: function(val) {
		return /^[0-9]+/g.test(val);
	},
	isFolder: function(val) {}
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

	if( vys(validators.isAlphaNum, params.tag) &&
		vys(validators.isState, params.state) &&
		vys(validators.isSort, params.sort) &&
		vys(validators.isInt, params.max) &&
		vys(validators.isInt, params.interval) &&
		vys([validators.isFolder, validators.isAlphaNum], params.parent_folder) &&
		vys(validators.isAlphaNum, params.target_folder) ) {
			storage.set({
				tag: params.tag,
				state: params.state,
				sort:params.sort,
				max: params.max,
				parent_folder: params.parent_folder,
				target_folder: params.target_folder
			});
			callback();
	}

}

function onLoad() {
	// bind click and changes
	document.querySelector("#loginBtn").addEventListener('click', function() {
		console.log("a");
		login(function(err) {
			if(err) {
				setErrorMessage("Login failed. Try again.");
			} else {
				loadSettingsValues();
				setSettingsState();
			}
		});
	});

	document.querySelector("#logout").addEventListener('click', function() {
		logout(function() {
			setLoginState();
		});
	});
	document.querySelector("#save").addEventListener('click', function() {
		var value = function(sel) {
			return document.querySelector(sel).value;
		};

		validate({
			"tag": value("#tagToImport"),
			"state": value("#state"),
			//"sort": value("#sort"),
			//"max": value("#maxPmarks"),
			//"parent_folder": value("#parentFolder"),
			"target_folder": value("#targetFolder"),
			//"interval": value("#interval")
		}, loadSettingsValues);
	});

	/*document.querySelector("#interval").addEventListener('change', function() {
		document.querySelector("#intervalDescription").innerText = document.querySelector("#interval").value;
	});*/

	if(localStorage.getItem("access_token")) {
		setSettingsState();
		loadSettingsValues();
	}else{
		setLoginState();
	}
}

document.addEventListener('DOMContentLoaded', onLoad);