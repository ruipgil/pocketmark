var consumer_key = chrome.runtime.getManifest().pocket_consumer_key;
// pocket options
var pocket_options = {
	// tag to look for in pocket
	tag: "bookmark",
	// states to look for
	state: POCKET.STATE.ALL,
	// number of pocketmarks to get
	count: undefined,
	// sorting
	sort: POCKET.SORT.NEWEST
};
// pocketmark's own setup options
var pmarks_options = {
	// folder to insert the folder
	parent_folder: "1",
	// folder name
	target_folder: "pocketmark"
}

function setup() {
	if( !localStorage.getItem("access_token") ) {
		login(function(err, access_token, username) {
			localStorage.setItem("access_token", access_token);
			localStorage.setItem("username", username);
		});
	}
}

function login(callback) {
	var redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL());
	POCKET.auth.request(
		consumer_key,
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
						consumer_key,
						token,
						callback);
				});
		});
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
		consumer_key,
		localStorage.getItem(access_token),
		pocket_options,
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
		getBookmarkFolder(pmarks_options.target_folder, function(folder) {
			clearFolder(folder.id, function() {
				async.each(pmarks, function(pmark, done) {
					addBookmark(folder.id, pmark.title, pmark.url, function() { done() });
				}, function(err) {});
			});
		}, pmarks_options.parent_folder);
	});
}