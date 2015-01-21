var consumer_key = "%pockets-consumer-key%";
var POCKET = {
	// appends the consumer key and the access token to an object, 
	/**
	 * Appends the consumer key and the access token to an object.
	 *
	 * @param  {!string} consumer_key Pocket's consumer key.
	 * @param  {!string} access_token Pocket's access token.
	 * @param  {=Object} obj Object.
	 * @return {!Object} Object with consumer key and access token and
	 *   the other key-value's of the provided object, if provided.
	 */
	_createParams: function(consumer_key, access_token, obj) {
		obj = obj || {};
		obj.consumer_key = consumer_key;
		obj.access_token = access_token;
		return obj;
	},
	/**
	 * Makes a request.
	 *
	 * @param  {!string} method Request method, such as POST, GET, etc.
	 * @param  {!string} url URL to make the request.
	 * @param  {!Object} data Object with data to send.
	 * @param  {!function(?Error, ?Object)} callback Callback function.
	 *   It has two arguments. The first is the error and should be
	 *   undefined if there was no error. The second is result object
	 *   of the call, it is undefined if there was an error.
	 */
	_request: function(method, url, data, callback) {
		var xhr = new XMLHttpRequest();

		xhr.open(method?method:"GET", url, true);

		xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
		xhr.setRequestHeader("X-Accept", "application/json");
		xhr.send(JSON.stringify(data));

		xhr.onreadystatechange = function() {
			if( xhr.readyState === xhr.DONE ) {
				var response, err;
				try {
					response = JSON.parse(xhr.responseText);
				} catch (e) {
					err = e;
				}
				callback(err, response);
			}
		}
	},
	/**
	 * URI for the add API call.
	 *
	 * @type {!string}
	 * @constant
	 */
	ADD_URI: "https://getpocket.com/v3/add",
	/**
	 * Adds an item to pocket.
	 * {@see http://getpocket.com/developer/docs/v3/add}
	 *
	 * @param {!string} consumer_key Application's consumer key.
	 * @param {!string} access_token User's access token.
	 * @param {!Object} params Object with the details of the item to
	 *   add. And url key-value must exists.
	 * @param {!function(?Error, ?number, ?Object)} callback Callback
	 *   function. It has three arguments. An error, if there was one,
	 *   the status and the item added.
	 */
	add: function(consumer_key, access_token, params, callback) {
		POCKET._request(
			"POST",
			POCKET.ADD_URI,
			POCKET._createParams(consumer_key, access_token, params),
			function(err, data) {
				if(err) {
					callback(err);
				} else {
					callback(null, data.status, data.item);
				}
			});
	},
	modify: function(consumer_key, access_token, params, callback) {
		// source: http://getpocket.com/developer/docs/v3/modify
		// TODO
	},
	/**
	 * URI for the retrieve API call.
	 *
	 * @type {!string}
	 * @constant
	 */
	RETRIEVE_URI: "https://getpocket.com/v3/get",
	/**
	 * Retrieves an item to pocket.
	 * {@see http://getpocket.com/developer/docs/v3/retrieve}
	 *
	 * @param {!string} consumer_key Application's consumer key.
	 * @param {!string} access_token User's access token.
	 * @param {!Object} params Object with the details of the items to
	 *   retrieve.
	 * @param {!function(?Error, ?number, ?Object)} callback Callback
	 *   function. It has three arguments. An error, if there was one,
	 *   the status and the list of items.
	 */
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
				if(err) {
					callback(err);
				} else {
					callback(null, data.status, data.list);
				}
			});
	},
	auth: {
		/**
		 * URI for the request token API call.
		 *
		 * @type {!string}
		 * @constant
		 */
		REQUEST_URI: "https://getpocket.com/v3/oauth/request",
		/**
		 * Requests token. This is step two.
		 *
		 * @param  {!string} consumer_key Application's consumer key.
		 * @param  {!string} redirect_uri URL to redirect.
		 * @param  {function(?Error, ?string)} callback Callback
		 *   function, has two arguments. Error, if there's one, and
		 *   request token.
		 */
		request: function(consumer_key, redirect_uri, callback) {
			POCKET._request(
				"POST",
				POCKET.auth.REQUEST_URI,
				{
					"consumer_key": consumer_key,
					"redirect_uri": redirect_uri
				},
				function(err, data) {
					if(err) {
						callback(err);
					} else {
						callback(null, data.code);
					}
				});
		},
		/**
		 * URI for the authorize request API call.
		 *
		 * @type {!string}
		 * @constant
		 */
		AUTHORIZE_URI: "https://getpocket.com/v3/oauth/authorize",
		/**
		 * Gets access token. This is step five.
		 *
		 * @param  {!string} consumer_key Application's consumer key.
		 * @param  {!string} request_token Request token from <code>
		 *   request</code> method.
		 * @param  {function(?Error, ?string)} callback Callback
		 *   function, has three arguments. Error, if there's one, an
		 *   access token and a username.
		 */
		authorize: function(consumer_key, request_token, callback) {
			POCKET._request(
				"POST",
				POCKET.auth.AUTHORIZE_URI,
				{
					"consumer_key": consumer_key,
					"code": request_token
				},
				function(err, data, url) {
					if(err) {
						callback(err);
					}else{
						callback(null, data.access_token, data.username);
					}
				});
		},
		/**
		 * URI for the authorization API call.
		 *
		 * @type {!string}
		 * @constant
		 */
		G_AUTHORIZE_URI: "https://getpocket.com/auth/authorize",
		/**
		 * Gets the authorize URL given a request token and a redirect
		 *   url.
		 *
		 * @param  {!string} token Request token obtained from request
		 *   method.
		 * @param  {!string} redirectUrl URL to redirect after the
		 *   user as accepted.
		 * @return {!string} URL to authorize the request token.
		 */
		getAuthorizeURL: function(token, redirectUrl) {
			return POCKET.auth.G_AUTHORIZE_URI+"?request_token="+token+"&redirect_uri="+redirectUrl;
		}
	},
	/**
	 * State of an item.
	 *
	 * @type {!Object}
	 * @enum
	 */
	STATE: {
		ALL: "all",
		UNREAD: "unread",
		ARCHIVE: "archive"
	},
	/**
	 * Detail of item(s).
	 *
	 * @type {!Object}
	 * @enum
	 */
	DETAIL_TYPE: {
		SIMPLE: "simple",
		COMPLETE: "complete"
	},
	/**
	 * Sorting of a list.
	 *
	 * @type {!Object}
	 * @enum
	 */
	SORT: {
		NEWEST: "newest",
		OLDEST: "oldest",
		TITLE: "title",
		SITE: "site"
	},
	/**
	 * Type of item.
	 *
	 * @type {!Object}
	 * @enum
	 */
	CONTENT_TYPE: {
		ARTICLE: "article",
		VIDEO: "video",
		IMAGE: "image"
	},
	/**
	 * Tag type.
	 *
	 * @type {!Object}
	 * @enum
	 */
	TAG: {
		UNTAGGED: "_untagged_"
	},
	/**
	 * Favorite.
	 *
	 * @type {!Object}
	 * @enum
	 */
	FAVORITE: {
		YES: 1,
		NO: 0
	}
};