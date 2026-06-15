#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

package_dirs=(
  "packages/wujie-core"
  "packages/wujie-vue2"
  "packages/wujie-vue3"
  "packages/wujie-react"
)

scripts=(
  "local-angular12-build.sh"
  "local-vue3-build.sh"
  "local-vue2-build.sh"
  "local-vite-build.sh"
  "local-react17-build.sh"
  "local-react16-build.sh"
  "local-main-vue.sh"
  "local-main-react.sh"
)

pids=()
names=()

cleanup() {
  if ((${#pids[@]} > 0)); then
    printf '\n[all-build] stopping running builds...\n' >&2
    kill "${pids[@]}" 2>/dev/null || true
  fi
}

run_build() {
  local script="$1"
  local name="${script#local-}"
  name="${name%.sh}"

  printf '[%s] starting %s\n' "$name" "$script"
  bash "$SCRIPT_DIR/$script" 2>&1 | sed "s/^/[$name] /"
}

run_package_prepack() {
  local package_dir="$1"
  local name="${package_dir#packages/}"

  printf '[packages] prepacking %s\n' "$name"
  pnpm --dir "$ROOT_DIR/$package_dir" run prepack
}

for package_dir in "${package_dirs[@]}"; do
  run_package_prepack "$package_dir"
done

trap cleanup INT TERM

for script in "${scripts[@]}"; do
  run_build "$script" &
  pids+=("$!")
  names+=("$script")
done

failed=0

for index in "${!pids[@]}"; do
  pid="${pids[$index]}"
  script="${names[$index]}"

  if wait "$pid"; then
    printf '[all-build] %s succeeded\n' "$script"
  else
    status=$?
    printf '[all-build] %s failed with exit code %s\n' "$script" "$status" >&2
    failed=1
  fi
done

trap - INT TERM

if ((failed != 0)); then
  printf '[all-build] one or more builds failed\n' >&2
  exit 1
fi

printf '[all-build] all builds completed successfully\n'
