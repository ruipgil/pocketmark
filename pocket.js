var consumer_key;
var POCKET = {
	_createParams: function(consumer_key, access_token, obj) {
		obj = obj || {};
		obj.consumer_key = consumer_key;
		obj.access_token = access_token;
		return obj;
	},
	_request: function(method, url, data, callback) {
		var xhr = new XMLHttpRequest();

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
		if(typeof params === "function") {
			callback = params;
			params = {};
		}
		POCKET._request(
			"POST",
			POCKET.RETRIEVE_URI,
			POCKET._createParams(consumer_key, access_token, params),
			function(err, data) {
				callback(err, data.status, data.list); // TODO remove status and send err instead
			});
	},
	auth: {
		REQUEST_URI: "https://getpocket.com/v3/oauth/request",
		request: function(consumer_key, redirect_uri, callback) {
			POCKET._request(
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
			POCKET._request(
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
		},
		G_AUTHORIZE_URI: "https://getpocket.com/auth/authorize",
		getAuthorizeURL: function(token, redirectUrl) {
			return POCKET.auth.G_AUTHORIZE_URI+"?request_token="+token+"&redirect_uri="+redirectUrl;
		}
	},
	STATE: {
		ALL: "all",
		UNREAD: "unread",
		ARCHIVE: "archive"
	},
	DETAIL_TYPE: {
		SIMPLE: "simple",
		COMPLETE: "complete"
	},
	SORT: {
		NEWEST: "newest",
		OLDEST: "oldest",
		TITLE: "title",
		SITE: "site"
	},
	CONTENT_TYPE: {
		ARTICLE: "article",
		VIDEO: "video",
		IMAGE: "image"
	},
	TAG: {
		UNTAGGED: "_untagged_"
	},
	FAVOURITE: {
		YES: 1,
		NO: 0
	}
};