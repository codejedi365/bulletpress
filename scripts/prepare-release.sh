#!/bin/bash

replay() { printf '%s\n' "$*";}
log() { replay "$@" | awk -v "PREFIX=$LOG_PREFIX" -F '\\\\n' '{print PREFIX " " $1}'; }
error() { replay "$@" | awk >&2 -v "PREFIX=$LOG_PREFIX" -F '\\\\n' '{print PREFIX " " $1}'; }

if ! npm pack; then
    error "Artifact packaging failed!"
    exit 1
fi

if ! sha256sum --binary bulletpress-*.tgz >> checksums.txt; then
    error "Failed to create checksum for distribution package!"
    exit 1
fi

DEFAULT_KEY_OPT=""
if npm exec -- is-ci; then
    DEFAULT_KEY_OPT="--default-key codejedi365+bot@gmail.com"
fi

if ! eval "gpg $DEFAULT_KEY_OPT --sign --detach-sign checksums.txt"; then
    error "Failed to digitally-sign checksums file!"
    exit 1
fi
