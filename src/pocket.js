var consumer_key = "{{consumer-key}}";
var Pocket;
(function() {
	var POSTrequest = function(url, data, callback) {
		var xhr = new XMLHttpRequest();

		xhr.open("POST", url, true);

		xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
		xhr.setRequestHeader("X-Accept", "application/json");
		console.log(data);
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
	};

	var createParams = function(consumer_key, access_token, obj) {
		obj = obj || {};
		obj.consumer_key = consumer_key;
		obj.access_token = access_token;
		return obj;
	};

	var URI = {
			ADD: "https://getpocket.com/v3/add",
			MODIFY: "https://getpocket.com/v3/modify",
			RETRIEVE: "https://getpocket.com/v3/get",
			REQUEST: "https://getpocket.com/v3/oauth/request",
			AUTHORIZE: "https://getpocket.com/v3/oauth/authorize",
			G_AUTHORIZE: "https://getpocket.com/auth/authorize"
		};

	Pocket = function(consumer_key, access_token) {
		this.consumer_key = consumer_key;
		this.access_token = access_token;
	};
	Pocket.prototype = {
		constructor: Pocket,
		/**
		 * Adds an item to pocket.
		 * {@see http://getpocket.com/developer/docs/v3/add}
		 *
		 * @param {!Object} params Object with the details of the item
		 *   to add. And url key-value must exists.
		 * @param {!function(?Error, ?number, ?Object)} callback
		 *   Callback function. It has three arguments. An error, if
		 *   there was one, the status and the item added.
		 */
		add: function(params, callback) {
			POSTrequest(
				URI.ADD,
				createParams(this.consumer_key, this.access_token, params),
				function(err, data) {
					if(err) {
						callback(err);
					} else {
						callback(null, data.status, data.item);
					}
				});
		},
		modify: function(params, callback) {
			POSTrequest(
				URI.MODIFY,
				createParams(this.consumer_key, this.access_token, params),
				function(err, data) {
					if(err) {
						callback(err);
					} else {
						callback(null, data.status, data.item);
					}
				});
		},
		retrieve: function(params, callback) {
			POSTrequest(
				URI.RETRIEVE,
				createParams(this.consumer_key, this.access_token, params),
				function(err, data) {
					if(err) {
						callback(err);
					} else {
						callback(null, data.status, data.list);
					}
				});
		}
	};
	Pocket.auth = {
		request: function(consumer_key, redirect_uri, callback) {
			POSTrequest(
				URI.REQUEST,
				{
					"consumer_key": consumer_key,
					"redirect_uri": redirect_uri
				},
				function(err, data, url) {
					if(err) {
						callback(err);
					}else{
						callback(null, data.code);
					}
				});
		},
		authorize: function(consumer_key, request_token, callback) {
			POSTrequest(
				URI.AUTHORIZE,
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
		getAuthorizeURL: function(token, redirectUrl) {
			return URI.G_AUTHORIZE+"?request_token="+token+"&redirect_uri="+redirectUrl;
		}
	};
	/**
	 * State of an item.
	 *
	 * @type {!Object}
	 * @enum
	 */
	Pocket.STATE = {
		ALL: "all",
		UNREAD: "unread",
		ARCHIVE: "archive"
	};
	/**
	 * Detail of item(s).
	 *
	 * @type {!Object}
	 * @enum
	 */
	Pocket.DETAIL_TYPE = {
		SIMPLE: "simple",
		COMPLETE: "complete"
	};
	/**
	 * Sorting of a list.
	 *
	 * @type {!Object}
	 * @enum
	 */
	Pocket.SORT = {
		NEWEST: "newest",
		OLDEST: "oldest",
		TITLE: "title",
		SITE: "site"
	};
	/**
	 * Type of item.
	 *
	 * @type {!Object}
	 * @enum
	 */
	Pocket.CONTENT_TYPE = {
		ARTICLE: "article",
		VIDEO: "video",
		IMAGE: "image"
	};
	/**
	 * Tag type.
	 *
	 * @type {!Object}
	 * @enum
	 */
	Pocket.TAG = {
		UNTAGGED: "_untagged_"
	};
	/**
	 * Favorite.
	 *
	 * @type {!Object}
	 * @enum
	 */
	Pocket.FAVORITE = {
		YES: 1,
		NO: 0
	};

})();