#!/usr/bin/env bash

export CODE_TESTS_PATH="$(pwd)/client/out/test"
export CODE_TESTS_WORKSPACE="$(pwd)/client/testFixture"

cmd = 'node "$(pwd)/client/node_modules/vscode/bin/test"'
#$cmd
## get status ##
return $cmd

#read -rsp $'Press enter to continue...\n'