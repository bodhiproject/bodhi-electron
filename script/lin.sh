#!/bin/sh

# build Linux
npm install
./node_modules/.bin/electron-builder build -l -c.extraMetadata.encryptOk=true
