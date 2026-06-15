#!/bin/bash

cd $(dirname $0)/..

set -eo pipefail

cd ./examples/react16

npm run build

cd ../../

rm -rf ../demo-react16/*


mv examples/react16/build/* ../demo-react16/
cp ../demo-react16/index.html ../demo-react16/404.html
cd ../demo-react16
git add .
if git diff --cached --quiet; then
  echo "nothing to commit"
else
  git commit -m 'feat: demo修改'
fi
git push

