#!/bin/bash

cd $(dirname $0)/..

set -eo pipefail

cd ./examples/react17

npm run build

cd ../../

rm -rf ../demo-react17/*


mv examples/react17/build/* ../demo-react17/
cp ../demo-react17/index.html ../demo-react17/404.html
cd ../demo-react17
git add .
if git diff --cached --quiet; then
  echo "nothing to commit"
else
  git commit -m 'feat: demo修改'
fi
git push

