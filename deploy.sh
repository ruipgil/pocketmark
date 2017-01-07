#!/bin/sh
value=`cat consumer.key`;
version=`node --eval "console.log(require('./build/chrome/manifest.json').version)"`;
evers=`git tag -l 'v'$version`
if [ -z $evers ]
then
	echo "var consumer_key=\""$value"\";" > ./build/chrome/js/consumer.key.js;
	zip -r pocketmark.v$version.zip build/chrome/;
	git tag v$version;
	echo 'Great success! If everything is good, push it';
else
	echo "There's a tag with this version (v"$version"), change the version on manifest.json"
fi
