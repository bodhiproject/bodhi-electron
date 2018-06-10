#!/bin/sh

# build Mac testnet only
npm run install-dep
./node_modules/.bin/electron-builder build -m -c.extraMetadata.encryptOk=true -c.extraMetadata.testnetOnly=true
