var intervalID = null;
var lastUpdate = 0;
var pocket_options = null;
var pmarks_options = null;

function buildObjects() {
	var t = storage.get("lastChange");
	if(!pocket_options || !pmarks_options || lastUpdate < t) {
		pocket_options = {
			tag: storage.get("tag"),
			state: storage.get("state"),
			//count: storage.get("count"),
			sort: POCKET.SORT.NEWEST//storage.get("sort")
		};
		pmarks_options = {
			parent_folder: storage.get("parent_folder"),
			target_folder: storage.get("target_folder"),
			interval: Number(storage.get("interval"))
		}
		lastUpdate = t;
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
		storage.get("access_token"),
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
					// TODO error handling
				});
			});
		}, pmarks_options.parent_folder);
	});
}

function start() {
	buildObjects();
	update();
	intervalID = setInterval(function() {
		update();
	}, pmarks_options.interval * 60000);
}

function stop() {
	clearInterval(intervalID);
	intervalID = null;
}

function run() {
	if( storage.get("access_token") || intervalID !== null ) {
		start();
	}
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.start) {
		run();
	} else if(request.stop) {
		stop();
	} else if(request.restart) {
		stop();
		run();
	}
});

run();