#!/bin/sh

# build Mac testnet only
npm install
./node_modules/.bin/electron-builder build -m -c.extraMetadata.encryptOk=true -c.extraMetadata.testnetOnly=true
