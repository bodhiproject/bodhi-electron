#!/bin/sh

# update submodule with remote
echo 'Updating submodules...'
git submodule update --recursive --remote

# install dependencies
echo 'Installing dependencies...'
npm install
./node_modules/.bin/yarn install

# install submodule dependencies
echo 'Installing submodule dependencies...'
npm --prefix ./server install ./server
