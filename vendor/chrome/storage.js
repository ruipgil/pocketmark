var storage = {
	get: function(key, callback) {
		if(Array.isArray(key)) {
			chrome.storage.sync.get(key, callback);
		} else {
			chrome.storage.sync.get(key, function(values) {
				callback(values[key]);
			});
		}
	},
	set: function(key, value, callback) {
		callback = callback || function() {};
		if (typeof key === "object") {
			callback = value || callback;
			key.lastChange = Date.now();
			chrome.storage.sync.set(key, callback);
		} else {
			chrome.storage.sync.set({
				lastChange: Date.now(),
				key: value
			}, callback);
		}
	},
	getAll: function(callback) {
		storage.get(["access_token",
			"username",
			"tag",
			"state",
			"parent_folder",
			"target_folder",
			"interval",
			"pocket_on_save",
			"lastChange",
			"pmarks"
		], callback);
	},
	init: function(access_token, username) {
		return storage.set({
			access_token: access_token,
			username: username,
			tag: "pocketmark",
			state: Pocket.STATE.ALL,
			//count: 0,
			//sort: Pocket.SORT.NEWEST,
			parent_folder: "1",
			target_folder: "pocketmark",
			interval: 1,
			pocket_on_save: 0,
			lastChange: Date.now(),
			pmarks: "{}"
		});
	},
	clear: function(callback) {
		chrome.storage.sync.clear(callback || function() {});
	}
}