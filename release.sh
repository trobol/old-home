#!/bin/sh

# current Git branch
branch=$(git describe --tags --abbrev=0)
url=$(git config --get remote.origin.url)
echo $branch
git checkout gh-pages
if [ ! -d "$branch" ]; then
 	 # Control will enter here if $DIRECTORY exists.
  	git submodule add -b master $url $branch
else
	git submodule update $branch
fi
git add .
git commit . -m 'auto update'
git push --set-upstream origin gh-pages
sleep 5 # Waits 0.5 second.