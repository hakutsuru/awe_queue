#!/usr/bin/env bash

#
# format-backend
#
# cleanup backend javascript via prettier
#

prettier --print-width 96 --write "backend/*/*.js"
prettier --print-width 96 --write "backend/*.js"
