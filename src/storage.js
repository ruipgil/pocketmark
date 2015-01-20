var storage = {
	get: function(key) {
		return localStorage.getItem(key);
	},
	set: function(key, value) {
		if(typeof key === "object") {
			storage._bulkSet(key);
		} else {
			localStorage.setItem(key, value);
			localStorage.setItem("lastChange", Date.now());
		}
		return storage;
	},
	_bulkSet: function(obj) {
		for(var x in obj) {
			storage.set(x, obj[x]);
		}
		return storage;
	},
	init: function(access_token, username) {
		return storage.set({
			access_token: access_token,
			username: username,
			tag: "pocketmark",
			state: POCKET.STATE.ALL,
			//count: 0,
			//sort: POCKET.SORT.NEWEST,
			parent_folder: "1",
			target_folder: "pocketmark",
			interval: 1,
			pocket_on_save: 0,
			lastChange: Date.now()
		});
	},
	clear: function() {
		localStorage.clear();
	}
}