#!/bin/bash

set -eux

script_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
project_root=$( cd -- "$script_dir/.." &> /dev/null && pwd)
src_root="$project_root/src"
public_root="$project_root/public"
cp "$src_root"/images/* "$project_root"/public/
cp "$src_root"/humans.txt "$project_root"/public/
npx stylus --compress --out "$public_root" "$src_root/main.styl"
npx pug --pretty --path "$public_root" --basedir "$public_root" \
    --out "$public_root" "$src_root/index.pug"
