#!/usr/bin/env bash

#
# format-frontend
#
# cleanup frontend source files via prettier
#

# javascript files
prettier --print-width 96 --write "frontend/src/*.js"

# vue components
# BEWARE: inconsistent results in testing
prettier --print-width 96 --write "frontend/src/*.vue"
prettier --print-width 96 --write "frontend/src/*/*.vue"

