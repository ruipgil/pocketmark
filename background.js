var options = {
	tag: "bookmark",
	consumer_key: "",
	access_token: "",
	state: "all", // unread, archive, all
	count: 10,
	target_folder: "pocketmark",
	detail_type: "complete",
	sort: "oldest" // newest, oldest, title, site
};

function makeRequest(method, url, data, callback) {
	var xhr = new XMLHttpRequest();

	console.log(JSON.stringify(data));
	xhr.open(method?method:"GET", url, true);

	xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
	xhr.send(JSON.stringify(data));

	xhr.onreadystatechange = function() {
		if( xhr.readyState === xhr.DONE ) {
			try {
				callback(null, JSON.parse(xhr.responseText));
			} catch (e) {
				callback(e, null);
			}
		}
	}
}

function retrieveBookmarks(callback) {
	var API_URI = "https://getpocket.com/v3/get";
	makeRequest("POST", API_URI, {
		consumer_key: options.consumer_key,
		access_token: options.access_token,
		tag: options.tag,
		count: options.count,
		state: options.state,
		detail_type: "simple"
	}, function(err, data) {
		if(err) {
			console.error(err);
			return;
		}
		console.log("Data:");
		console.log(data);
	});
};

