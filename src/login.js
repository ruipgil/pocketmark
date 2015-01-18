function login(callback) {
	var redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL()+"settings.html");
	callback = callback || function() {};
	POCKET.auth.request(
		consumer_key,
		redirectUrl,
		function(err, token) {
			if(err) {
				callback(err);
				return;
			}
			chrome.identity.launchWebAuthFlow(
				{
					url: POCKET.auth.getAuthorizeURL(token, redirectUrl),
					interactive: true
				},
				function() {
					POCKET.auth.authorize(
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
	storage.clear();
	callback();
}