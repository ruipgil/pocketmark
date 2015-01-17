var POCKET = {
	_createParams: function(consumer_key, access_token, obj) {
		obj = obj || {};
		obj.consumer_key = consumer_key;
		obj.access_token = access_token;
		return obj;
	},
	_request: function(method, url, data, callback) {
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
		if(params instanceof function) {
			callback = params;
			params = {};
		}
		pocket._request(
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
			pocket._request(
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
			pocket._request(
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
			return G_AUTHORIZE_URI+"?request_token="+token+"&redirect_uri="+redirectUrl;
		}
	}
};