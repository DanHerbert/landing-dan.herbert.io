#!/bin/bash

set -eux

script_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
project_root=$( cd -- "$script_dir/.." &> /dev/null && pwd)
src_root="$project_root/src"
public_root="$project_root/public"
mkdir -p "$public_root"
cp "$src_root"/images/* "$public_root/"
cp "$src_root"/*.txt "$public_root/"

npx stylus --compress --out "$public_root" "$src_root/main.styl"
npx --package @anduh/pug-cli pug3 --pretty --path "$public_root" --basedir "$public_root" \
        --out "$public_root" "$src_root/index.pug"
rm "$public_root/main.css"