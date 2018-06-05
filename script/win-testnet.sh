#!/bin/sh

# build Windows testnet only
npm run install-dep
./node_modules/.bin/electron-builder build -w -c.extraMetadata.encryptOk=true -c.extraMetadata.testnetOnly=true
