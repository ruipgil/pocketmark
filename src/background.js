var intervalID;
// pocket options
var pocket_options = {
	// tag to look for
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
	target_folder: "pocketmark",
	// one minute
	interval: 1
}

function setup(callback) {
	if( !localStorage.getItem("access_token") ) {
		/*login(function(err, access_token, username) {
			localStorage.setItem("access_token", access_token);
			localStorage.setItem("username", username);
			callback();
		});*/
	}else{
		callback();
	}
}

function transformData(data) {
	var e = data,
		res = [];
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
		localStorage.getItem("access_token"),
		pocket_options,
		function(err, status, list) {
			if(err) {
				callback(err);
				return;
			}
			callback(null, transformData(list));
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
					addBookmark(folder.id, pmark.title, pmark.url, function() { done(); });
				}, function(err) {
					console.log("bip");
				});
			});
		}, pmarks_options.parent_folder);
	});
}

function start() {
	intervalID = setInterval(function() {
		update();
	}, pmarks_options.interval * 60000);
}

function stop() {
	clearInterval(intervalID);
}

function run() {
	setup(start);
}

run();