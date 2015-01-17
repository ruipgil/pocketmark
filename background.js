var options = {
	tag: "bookmark",
	consumer_key: "",
	access_token: "",
	state: "all", // unread, archive, all
	//count: 10,
	target_folder: "pocketmark",
	detail_type: "complete",
	sort: "oldest" // newest, oldest, title, site
};

var POCKET = {
	_createParams: function(consumer_key, access_token, obj) {
		obj = obj || {};
		obj.consumer_key = consumer_key;
		obj.access_token = access_token;
		return obj;
	},
	add: function(consumer_key, access_token, params, callback) {
		// source: http://getpocket.com/developer/docs/v3/add
		// TODO
	},
	modify: function(consumer_key, access_token, params, callback) {
		// source: http://getpocket.com/developer/docs/v3/modify
		// TODO
	},
	RETRIEVE_URI: "https://getpocket.com/v3/get",
	retrieve: function(consumer_key, access_token, params, callback) {
		// source: http://getpocket.com/developer/docs/v3/retrieve
		makeRequest(
			"POST",
			POCKET.RETRIEVE_URI,
			POCKET._createParams(consumer_key, access_token,params),
			function(err, data) {
				callback(err, data.status, data.list); // TODO remove status and send err instead
			});
	},
	auth: {
		REQUEST_URI: "https://getpocket.com/v3/oauth/request",
		request: function(consumer_key, redirect_uri, callback) {
			makeRequest(
				"POST",
				POCKET.auth.REQUEST_URI,
				{
					"consumer_key": consumer_key,
					"redirect_uri": redirect_uri
				},
				function(err, data) {
					// TODO error treatment
					callback(err, data.code);
				});
		},
		AUTHORIZE_URI: "https://getpocket.com/v3/oauth/authorize",
		authorize: function(consumer_key, request_token, callback) {
			makeRequest(
				"POST",
				POCKET.auth.AUTHORIZE_URI,
				{
					"consumer_key": consumer_key,
					"code": request_token
				},
				function(err, data) {
					// TODO error treatment
					callback(err, data.access_token, data.username);
				});
		}
	}
}

function login(callback) {

	var redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL());
    var consumerKey = options.consumer_key;
    var authUrl = "https://getpocket.com/v3/oauth/request";
    "redirect_uri=" + redirectUrl;
	POCKET.auth.request(options.consumer_key, redirectUrl, function(err, token) {
		var authUrl = "https://getpocket.com/auth/authorize?request_token="+token+"&redirect_uri="+redirectUrl;
		// TODO error treatment
		chrome.identity.launchWebAuthFlow({
			url: authUrl,
			interactive: true
		}, function() {
			POCKET.auth.authorize(options.consumer_key, token, function(err, access_token, username) {
				console.log(access_token);
				options.access_token = access_token;
				callback(access_token, username);
			});
		});
	});
}

function makeRequest(method, url, data, callback) {
	var xhr = new XMLHttpRequest();

	console.log(JSON.stringify(data));
	xhr.open(method?method:"GET", url, true);

	xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
	xhr.setRequestHeader("X-Accept", "application/json");
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

function transformData(data) {
	var e = data.list,
		res = [];
		console.log(e);
	for(var x in e) {
		var elm = e[x];
		res.push({
			order: elm["sort_id"],
			url: elm["resolved_url"],
			title: elm["resolved_title"],
		});
	}

	return res.sort(function(a, b) {
		return a.sort_id - b.sort_id;
	});
}

function retrievePocketmarks(callback) {
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
			callback(err);
			return;
		}
		callback(null, transformData(data));
	});
};

/**
 * Gets a folder from it's name.
 * If the search returns more than one result, the first is returned.
 * Otherwise and if a <code>parent id</code> is provided, the folder
 * is created.
 *
 * @param  {!string} folderName
 * @param  {!function(string|null)} callback
 * @param  {!string} parentId
 */
function getBookmarkFolder(folderName, callback, parentId) {
	chrome.bookmarks.search({ title: folderName }, function(result) {
		if(result.length >= 1) {
			callback(result[0]);
		} else if(result.length === 0) {
			if(parentId) {
				chrome.bookmarks.create({
					'parentId': parentId,
					'title': folderName,
				}, function(f) {
					callback(f);
				});
			}else {
				callback(null);
			}
		}
	});
}

function removeBookmark(bookmarkId, callback) {
	chrome.bookmarks.remove(bookmarkId, callback?function() {
			callback();
		}:function(){});
}

function clearFolder(folderId, callback) {
	chrome.bookmarks.getChildren(folderId, function(children) {
		async.each(children, function(child, done) {
			removeBookmark(child.id, done);
		}, function(err) {
			callback();
		});
	});
}

function addBookmark(parentId, title, url, callback) {
	chrome.bookmarks.create({
		parentId: parentId,
		title: title,
		url: url
	}, callback ? function(bookmark) {
			callback(bookmark);
		} : function() {});
}

function update() {
	retrievePocketmarks(function(err, pmarks) {
		getBookmarkFolder(options.target_folder, function(folder) {
			clearFolder(folder.id, function() {
				async.each(pmarks, function(pmark, done) {
					addBookmark(folder.id, pmark.title, pmark.url, function() { done() });
				}, function(err) {});
			});
		}, "1"); // id:1 is bkmrk bar TOFIX
	});
}