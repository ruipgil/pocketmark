#!/bin/sh
value=`cat consumer.key`;
version=`node --eval "console.log(require('./manifest.json').version)"`;
evers=`git tag -l 'v'$version`
if [ -z $evers ]
then
	sed -i 's/{{consumer-key}}/'$value'/g' src/pocket.js;
	zip -r pocketmark.v$version.zip libs/ src/ deploy.sh LICENSE manifest.json README.md;
	git tag v$version;
	echo 'Great success! If everything is good, push it';
	.
else
	echo "There's a tag with this version (v"$version"), change the version on manifest.json"
	.
fi
