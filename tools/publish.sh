#!/bin/bash

script_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
project_root=$( cd -- "$script_dir/.." &> /dev/null && pwd)

set -euv

cd "$project_root"
git pull --force
npm install
npm run publish
