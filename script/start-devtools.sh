# set vars
QTUM_PATH='./node_modules/bodhi-server/qtum/mac/bin'
RPC_PW='bodhi'

# start dev with Electron windows and devtools enabled
./node_modules/.bin/electron . --dev --encryptok --devtools --qtumpath=$QTUM_PATH --rpcpassword=$RPC_PW 
