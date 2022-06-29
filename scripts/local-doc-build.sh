#!/usr/bin/env bash

cd $(dirname $0)/..

set -eo pipefail

cd ./packages/wujie-doc

npm run docs:build

cd ../../

rm -rf ../doc/*

mv packages/wujie-doc/docs/.vuepress/dist/* ../doc/
cp ../doc/index.html ../doc/404.html
cd ../doc
git add .
git commit -m 'feat: demo修改'
git push
