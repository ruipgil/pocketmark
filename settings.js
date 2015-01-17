var $ = function(q) {
	document.querySelector(q);
};
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

function onLoad() {
	// bind click and changes
	document.querySelector("#loginBtn").addEventListener('click', function() {
		console.log("from here i should go to the login process and then back.");
		// login();
		login();
	});
	document.querySelector("#save").addEventListener('click', function() {
		// validate
		// store values
	});
	document.querySelector("#interval").addEventListener('change', function() {
		document.querySelector("#intervalDescription").innerText = document.querySelector("#interval").value;
	});

	// load values
	for(var x in pocket_options_map) {
		var y = pocket_options_map[x],
			elm = document.querySelector("#"+y); 
		if( elm ) {
			elm.value = pocket_options[x];
		}
	}
	for(var x in pmarks_options_map) {
		var y = pmarks_options_map[x],
			elm = document.querySelector("#"+y);
		if(elm) {
			elm.value = pmarks_options[x];
		}
	}

	var elmToHide;
	if(localStorage.getItem("access_token")) {
		elmToHide = "login";
	}else{
		elmToHide = "settings";
	}
	//document.querySelector("#"+elmToHide).classList.add("hide");
}

document.addEventListener('DOMContentLoaded', onLoad);