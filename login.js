function login(callback) {
	var redirectUrl = encodeURIComponent(chrome.identity.getRedirectURL()+"settings.html");
	POCKET.auth.request(
		consumer_key,
		redirectUrl,
		function(err, token) {
			// TODO error treatment
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
							console.log(err, access_token, username, "final login");
							localStorage.setItem("access_token", access_token);
							localStorage.setItem("username", username);
							if(callback) {
								callback(err, access_token, username);
							}
						});
				});
		});
}