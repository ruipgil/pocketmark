#!/bin/sh
value=`cat consumer.key`;
version=`node --eval "console.log(require('./manifest.json').version)"`;
evers=`git tag -l 'v'$version`
if [ -z $evers ]
then
	rm ./src/consumer.key.js;
	echo "var consumer_key=\""$value"\";" > ./src/consumer.key.js;
	zip -r pocketmark.v$version.zip bower_components src/ deploy.sh LICENSE manifest.json README.md .gitignore resources/;
	rm ./src/consumer.key.js;
	echo "var consumer_key=\"{{your-consumer-key-here}}\";" > ./src/consumer.key.js;
	git tag v$version;
	echo 'Great success! If everything is good, push it';
	.
else
	echo "There's a tag with this version (v"$version"), change the version on manifest.json"
	.
fi
