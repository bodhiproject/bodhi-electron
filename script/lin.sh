#!/bin/sh

# build Linux
npm run install-dep
./node_modules/.bin/electron-builder build -l -c.extraMetadata.encryptOk=true
