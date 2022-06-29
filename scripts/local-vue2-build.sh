#!/bin/bash

cd $(dirname $0)/..

set -eo pipefail

cd ./examples/vue2

npm run build

cd ../../

rm -rf ../demo-vue2/*


mv examples/vue2/dist/* ../demo-vue2
cp ../demo-vue2/index.html ../demo-vue2/404.html
cd ../demo-vue2
git add .
git commit -m 'feat: demo修改'
git push

