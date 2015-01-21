var storage = {
	get: function(key, callback) {
		if (Array.isArray(key)) {
			storage._bulkGet(key, callback)
		} else {
			callback(localStorage.getItem(key));
		}
	},
	_bulkGet: function(arr, callback) {
		var res = {};
		async.each(arr, function(k, done) {
			storage.get(k, function(r) {
				res[k] = r;
				done();
			});
		}, function(err) {
			callback(res);
		});
	},
	set: function(key, value, callback) {
		callback = callback || function() {};
		if (typeof key === "object") {
			callback = value || callback;
			storage._bulkSet(key, callback);
		} else {
			localStorage.setItem(key, value);
			localStorage.setItem("lastChange", Date.now());
			callback();
		}
	},
	_bulkSet: function(obj, callback) {
		var keys = Object.keys(obj);
		async.each(keys, function(k, done) {
			storage.set(k, obj[k], done);
		}, function(err) {
			console.log("done setting");
			callback();
		});
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
			"lastChange"
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
			lastChange: Date.now()
		});
	},
	clear: function(callback) {
		localStorage.clear();
		if (callback) {
			callback();
		}
	}
}