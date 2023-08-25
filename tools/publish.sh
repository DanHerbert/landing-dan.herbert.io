#!/bin/bash

# This script can update itself while running (since it updates through git)
# All commands must happen within these curly brace blocks to ensure everything
# loads into memory before executing.
{
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
project_root=$(cd -- "$script_dir/.." &>/dev/null && pwd)

set -euv

cd "$project_root"
if [[ $(git status --porcelain | wc -l) -gt 0 ]]; then
    git stash push --include-untracked \
        --message "Publishing content $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
fi
if [[ $(git branch --show-current) != 'main' ]]; then
    git checkout --force main
fi
git pull --force
npm install
npm run publish
}; exit
