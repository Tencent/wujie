#!/usr/bin/env bash

cd $(dirname $0)

set -eo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}============WujieVue开始编译============${NC}"

[ -d lib ] && rm -rf lib
[ -d esm ] && rm -rf esm

npm run lib

npm run esm

echo -e "${GREEN}============WujieVue编译成功============${NC}"