#!/bin/sh

# build Mac
npm run install-dep
./node_modules/.bin/electron-builder build -m -c.extraMetadata.encryptOk=true
