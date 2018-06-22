#!/bin/sh

# build Windows testnet only
npm install
./node_modules/.bin/electron-builder build -w -c.extraMetadata.encryptOk=true -c.extraMetadata.testnetOnly=true
