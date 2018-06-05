#!/bin/sh

# build Windows
npm run install-dep
./node_modules/.bin/electron-builder build -w -c.extraMetadata.encryptOk=true
