#!/bin/sh

# build Windows
npm install
./node_modules/.bin/electron-builder build -w -c.extraMetadata.encryptOk=true
