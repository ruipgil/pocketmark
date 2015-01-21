var running = false,
	ALARM_NAME = "updateLoop",
	lastUpdate = 0,
	pocket_options = null,
	pmarks_options = null,
	ONE_MINUTE = 60000;

/**
 * Build the options objects.
 */
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
			pocket_on_save: Number(storage.get("pocket_on_save")),
			interval: Number(storage.get("interval"))
		}
		lastUpdate = t;
	}
}

/**
 * Transforms the list received from pocket, into an internal format.
 *
 * @param  {!Object.<!string, !Object>} data Object received from
 *   pocket, ie, <code>list</code>
 * @return {!Array.<!Object>} Array of objects, ordered. The object
 *   has the keys <ul><li>order</li><li>url</li><li>title</li></ul>
 */
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

/**
 * Retrieves pocket items according to the options.
 *
 * @param  {!function(?Error, ?Array.<!Object>)} callback Callback
 *   function should have two arguments. When an error occurred the
 *   first argument is defined and the second, the result, is
 *   undefined. Otherwise the first parameter is null and the second
 *   parameter is a list of pocket items simplified.
 */
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
 * @param  {!function(?string)} callback
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

/**
 * Removes the a bookmark from chrome's bookmarks.
 *
 * @param  {!string} bookmarkId Bookmark id, given by chrome.
 * @param  {?function} callback Callback function. Doesn't receive
 *   nothing.
 */
function removeBookmark(bookmarkId, callback) {
	chrome.bookmarks.remove(bookmarkId, callback?function() {
			callback();
		}:function(){});
}

/**
 * Removes all bookmarks from a folder.
 *
 * @param  {!string} folderId Folder id, as provided by chrome.
 * @param  {!function} callback Callback function, doesn't receive
 *   nothing.
 */
function clearFolder(folderId, callback) {
	chrome.bookmarks.getChildren(folderId, function(children) {
		async.each(children, function(child, done) {
			removeBookmark(child.id, done);
		}, function(err) {
			callback();
		});
	});
}

/**
 * Adds a bookmark to a folder.
 *
 * @param {!string} parentId Folder id to insert the bookmark, as
 *   provided by chrome.
 * @param {!string} title Title of the bookmark. May be empty
 * @param {!string} url Url of the bookmark. Should not be empty, if
 *   so a folder is created instead of a bookmark.
 * @param {?function(Bookmark)} callback Callback function, that
 *   receives a bookmark as the first argument.
 */
function addBookmark(parentId, title, url, callback) {
	chrome.bookmarks.create({
		parentId: parentId,
		title: title || "",
		url: url
	}, callback ? function(bookmark) {
			callback(bookmark);
		} : function() {});
}

/**
 * Updates the folder with bookmarks representing pocket items.
 * This is a simple get, clear, update cycle.
 * First the pocket items are retrieved, then the folder is cleared
 *   and new bookmarks are inserted.
 * This method can and should be optimized.
 */
function update() {
	retrievePocketmarks(function(err, pmarks) {
		getBookmarkFolder(pmarks_options.target_folder, function(folder) {
			clearFolder(folder.id, function() {
				async.each(pmarks, function(pmark, done) {
					addBookmark(folder.id, pmark.title, pmark.url, function() { done(); });
				}, function(err) {});
			});
		}, pmarks_options.parent_folder);
	});
}

/**
 * Starts pocketmark. It builds the objects, updates one time and sets
 *   the alarm to trigger the next update.
 */
function start() {
	buildObjects();
	update();
	chrome.alarms.create(ALARM_NAME, {
		periodInMinutes: pmarks_options.interval
	});
	running = true;
}

/**
 * Stops the update cycle, by clearing the alarm.
 *
 * @param  {!function} callback Callback function.
 */
function stop(callback) {
	running = false;
	chrome.alarms.clear(ALARM_NAME, callback);
}

/**
 * Starts pocketmark if there is an access token, ie, the user is
 *   logged in.
 */
function run() {
	if( storage.get("access_token") ) {
		start();
	}
}

/**
 * Adds the alarm listener. Only updates when the alarm is the update
 *   one and when it was started and not stopped.
 */
chrome.alarms.onAlarm.addListener(function(alarm) {
	if(alarm.name === ALARM_NAME && running) {
		update();
	}
});

/**
 * Message listener to execute commands sent by the settings page.
 * This treats three kinds of messages:<ul>
 *   <li>start, to start pocketmark. This message is to be sent when
 *     the user just logged in.</li>
 *   <li>stop, to stop pocketmark. This message is to be sent when the
 *     user has logged out.</li>
 *   <li>restart, to stop and then start pocketmark.</li></ul>
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if(request.start) {
		run();
	} else if(request.stop) {
		stop();
	} else if(request.restart) {
		stop(run);
	}
});

/**
 * Adds a listener to add a item to pocket, when it was bookmarked.
 * This feature must be activated in the settings page.
 */
chrome.bookmarks.onCreated.addListener(function(id, bookmark) {
	if(pmarks_options.pocket_on_save && bookmark.url) {
		POCKET.add(
			consumer_key,
			storage.get("access_token"),
			{
				url: bookmark.url,
				tags: pocket_options.tag
			},
			function(err) {});
	}
});

run();