var options = {
	tag: "bookmark",
	consumer_key: "",
	access_token: "",
	state: "all", // unread, archive, all
	//count: 10,
	target_folder: "pocketmark",
	detail_type: "complete",
	parent_folder: "1", //bookmark bar
	sort: "oldest" // newest, oldest, title, site
};

function login(callback) {

	var redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL());
    var consumerKey = options.consumer_key;
    var authUrl = "https://getpocket.com/v3/oauth/request";
    "redirect_uri=" + redirectUrl;
	POCKET.auth.request(
		options.consumer_key,
		redirectUrl,
		function(err, token) {
			// TODO error treatment
			chrome.identity.launchWebAuthFlow(
				{
					url: POCKET.auth.getAuthorizeURL(token, redirectUrl),
					interactive: true
				},
				function() {
					POCKET.auth.authorize(
						options.consumer_key,
						token,
						callback);
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
	POCKET.retrieve(
		options.consumer_key,
		options.access_token,
		{
			tag: options.tag,
			count: options.count,
			state: options.state,
			detail_type: "simple"
		},
		function(err, data) {
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
		}, options.parent_folder);
	});
}