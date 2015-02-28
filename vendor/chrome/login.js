function login(callback) {
	var redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL()+"settings.html");
	callback = callback || function() {};
	Pocket.auth.request(
		consumer_key,
		redirectUrl,
		function(err, token) {
			if(err) {
				callback(err);
				return;
			}
			chrome.identity.launchWebAuthFlow(
				{
					url: Pocket.auth.getAuthorizeURL(token, redirectUrl),
					interactive: true
				},
				function() {
					Pocket.auth.authorize(
						consumer_key,
						token,
						function(err, access_token, username) {
							if(err) {
								callback(err);
							}else{
								storage.init(access_token, username);
								callback(null, access_token, username);
							}
						});
				});
		});
}

function logout(callback) {
	callback = callback || function() {};
	storage.clear(callback);
}