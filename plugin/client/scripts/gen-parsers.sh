#!/usr/bin/env bash

# TODO this still doesn't work on my mac laptop :(
# fix it and delete parsers/*.wasm from git

set -e

# Build parsers
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-policyspace
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-decisiongraph

mv *.wasm parsers