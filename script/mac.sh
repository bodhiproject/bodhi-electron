#!/bin/sh

# build Mac
npm install
./node_modules/.bin/electron-builder build -m -c.extraMetadata.encryptOk=true
