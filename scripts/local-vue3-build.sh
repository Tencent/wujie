#!/bin/bash

cd $(dirname $0)/..

set -eo pipefail

cd ./examples/vue3

npm run build

cd ../../

rm -rf ../demo-vue3/*


mv examples/vue3/dist/* ../demo-vue3/
cp ../demo-vue3/index.html ../demo-vue3/404.html
cd ../demo-vue3
git add .
if git diff --cached --quiet; then
  echo "nothing to commit"
else
  git commit -m 'feat: demo修改'
fi
git push

