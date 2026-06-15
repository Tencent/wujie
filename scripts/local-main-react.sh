#!/bin/bash

cd $(dirname $0)/..

set -eo pipefail

cd ./examples/main-react

npm run build

cd ../../

rm -rf ../demo-main-react/*


mv examples/main-react/build/* ../demo-main-react/ 
cp ../demo-main-react/index.html ../demo-main-react/404.html
cd ../demo-main-react
git add .
if git diff --cached --quiet; then
  echo "nothing to commit"
else
  git commit -m 'feat: demo修改'
fi
git push

