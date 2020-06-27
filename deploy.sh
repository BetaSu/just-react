#!/usr/bin/env sh

set -e
git push;
node .bin/changeBase.js /just-react/;

npm run build;

cd dist;
git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:BetaSu/just-react.git master:gh-pages
git push -f git@gitee.com:kasong/just-react.git master:gh-pages

cd -

rm -rf dist

node .bin/changeBase.js 