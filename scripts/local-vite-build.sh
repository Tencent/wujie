#!/bin/bash

cd $(dirname $0)/..

set -eo pipefail

cd ./examples/vite

npm run build

cd ../../

rm -rf ../demo-vite/*


mkdir -p ../demo-vite/
mv examples/vite/dist/* ../demo-vite/
sed -i '' 's/crossorigin/crossorigin="use-credentials"/g' ../demo-vite/index.html
cp ../demo-vite/index.html ../demo-vite/404.html
cd ../demo-vite
git add .
if git diff --cached --quiet; then
  echo "nothing to commit"
else
  git commit -m 'feat: demo修改'
fi
git push

