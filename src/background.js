var ALARM_NAME = "updateLoop",
	pocket_options = null,
	pmarks_options = null,
	lock = false,
	p = null;

/**
 * Build the options objects.
 */
function buildObjects(data) {
	pocket_options = {
		tag: data.tag,
		state: data.state,
		sort: Pocket.SORT.NEWEST
	};
	pmarks_options = {
		parent_folder: data.parent_folder,
		target_folder: data.target_folder,
		pocket_on_save: Number(data.pocket_on_save),
		interval: Number(data.interval)
	};
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
	p.retrieve(pocket_options, function(err, status, list) {
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
			lock = true;
			clearFolder(folder.id, function() {
				async.each(pmarks, function(pmark, done) {
					addBookmark(folder.id, pmark.title, pmark.url, function() { done(); });
				}, function(err) {
				});
			});
		}, pmarks_options.parent_folder);
	});
}

/**
 * Stops the update cycle, by clearing the alarm.
 *
 * @param  {!function} callback Callback function.
 */
function stop(callback) {
	p = null;
	chrome.alarms.clear(ALARM_NAME, callback);
}

/**
 * Starts pocketmark if there is an access token, ie, the user is
 *   logged in.
 */
function start() {
	storage.getAll(function(data) {
		if(data.access_token && data.username) {
			p = new Pocket(consumer_key, data.access_token);
			buildObjects(data);
			update();
			chrome.alarms.create(ALARM_NAME, {
				periodInMinutes: pmarks_options.interval
			});
		}
	});
}

/**
 * Adds the alarm listener. Only updates when the alarm is the update
 *   one and when it was started and not stopped.
 */
chrome.alarms.onAlarm.addListener(function(alarm) {
	if(alarm.name === ALARM_NAME && p) {
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
		start();
	} else if(request.stop) {
		stop();
	} else if(request.restart) {
		stop(start);
	}
});

/**
 * Adds a listener to add a item to pocket, when it was bookmarked.
 * Only items added to the pocketmark folder are added to pocket.
 * This feature must be activated in the settings page.
 */
/*chrome.bookmarks.onCreated.addListener(function(id, bookmark) {
	if( p && pmarks_options.pocket_on_save && bookmark.url ) {
		if( updating ){
			addedBookmarks
		} else {
			chrome.bookmarks.search(pmarks_options.target_folder, function(folder) {
				if(folder.id === bookmark.parentId) {
					p.add({
						url: bookmark.url,
						tags: pocket_options.tag
					}, function(err) {});
				}
			});
		}
	}
});*/

start();