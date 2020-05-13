#!/usr/bin/env bash

set -e

# Build parsers
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-policyspace
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-decisiongraph
./node_modules/.bin/tree-sitter build-wasm ./node_modules/tree-sitter-valueinference

mv *.wasm parsers