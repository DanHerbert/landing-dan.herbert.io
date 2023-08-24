#!/bin/bash

# This script can update itself while running (since it updates through git)
# All commands must happen within these curly brace blocks to ensure everything
# loads into memory before executing.
{
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
project_root=$(cd -- "$script_dir/.." &>/dev/null && pwd)

set -euv

cd "$project_root"
# This script runs as root through systemd, but git doesn't like operating on
# repositories that it does not own, hence the sudo stuff for git here.
project_user=$(stat -c '%U' ./)
if [[ $(sudo -u "$project_user" git status --porcelain | wc -l) -gt 0 ]]; then
    sudo -u "$project_user" git stash push --include-untracked \
        --message "Publishing content $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
fi
if [[ $(sudo -u "$project_user" git branch --show-current) != 'main' ]]; then
    sudo -u "$project_user" git checkout --force main
fi
sudo -u "$project_user" git pull --force
npm install
npm run publish
}; exit
