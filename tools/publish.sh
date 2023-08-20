#!/bin/bash

script_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
project_root=$( cd -- "$script_dir/.." &> /dev/null && pwd)

set -euv

cd "$project_root"
git pull --force
old_files=$(ls -A "$project_root/public/")
"$project_root/tools/build.sh"
cd /srv/www/dan.herbert.io/www-root/ && rm "$old_files"
cd -
cp -r "$project_root/public/" "/srv/www/dan.herbert.io/www-root/"
