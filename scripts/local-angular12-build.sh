#!/bin/bash

cd $(dirname $0)/..

set -eo pipefail

cd ./examples/angular12

npm run build

cd ../../

rm -rf ../demo-angular12/*


mv examples/angular12/dist/* ../demo-angular12/
cp ../demo-angular12/index.html ../demo-angular12/404.html
cd ../demo-angular12
git add .
if git diff --cached --quiet; then
  echo "nothing to commit"
else
  git commit -m 'feat: demo修改'
fi
git push

