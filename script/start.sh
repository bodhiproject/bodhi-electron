# set vars
QTUM_PATH='./server/qtum/mac/bin'
RPC_PW='bodhi'

# start dev with Electron windows
./node_modules/.bin/electron . --dev --encryptok --qtumpath=$QTUM_PATH --rpcpassword=$RPC_PW 
