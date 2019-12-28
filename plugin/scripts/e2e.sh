#!/usr/bin/env bash

export CODE_TESTS_PATH="$(pwd)/client/out/test"
export CODE_TESTS_WORKSPACE="$(pwd)/client/testFixture"

node "$(pwd)/client/node_modules/vscode/bin/test"
return 0

#read -rsp $'Press enter to continue...\n'