#!/bin/bash

cd $(dirname $0)

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

set -eo pipefail
echo -e "${GREEN}============Wujie开始编译============${NC}"

rm -rf ./lib ./esm

npm run lib

npm run esm

npx tsc

echo -e "${GREEN}============Wujie编译成功============${NC}"