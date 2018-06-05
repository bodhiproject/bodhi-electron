#!/bin/sh

# build Linux testnet only
npm run install-dep
./node_modules/.bin/electron-builder build -l -c.extraMetadata.encryptOk=true -c.extraMetadata.testnetOnly=true
