#!/bin/bash

script_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
project_root=$( cd -- "$script_dir/.." &> /dev/null && pwd)

set -euv

cd "$project_root"
if [[ $(git status --porcelain | wc -l) -gt 0 ]]; then
    git stash push --include-untracked --message "Publishing content $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
fi
if [[ $(git branch --show-current) != 'main' ]]; then
    git checkout --force main
fi
git pull --force
npm install
npm run publish
