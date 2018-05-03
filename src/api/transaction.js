const { Config, getContractMetadata } = require('../config/config');
const Utils = require('../utils/utils');
const { db } = require('../db/nedb'); 

const DEFAULT_GAS_COST = Config.DEFAULT_GAS_LIMIT * Config.DEFAULT_GAS_PRICE;

const getApproveObj = (token, amount) => {
  type: 'approve',
  gasLimit: Config.DEFAULT_GAS_LIMIT,
  gasCost: DEFAULT_GAS_COST,
  token,
  amount,
};

const Transaction = {
  
  async transactionCost(args) {
    const {
      type, // string
      token, // string
      amount, // number
      optionIdx, // number
      topicAddress, // address
      oracleAddress, // address
      senderAddress, // address
    } = args;

    // args validation
    if (!type) {
      throw new TypeError('type needs to be defined');
    }
    if (!senderAddress) {
      throw new TypeError('senderAddress needs to be defined');
    }
    if ((type === 'APPROVECREATEEVENT'
      || type === 'BET'
      || type === 'APPROVESETRESULT'
      || type === 'APPROVEVOTE'
      || type === 'TRANSFER')
      && (!token || !amount)) {
      throw new TypeError('token and amount need to be defined');
    }
    if ((type === 'APPROVESETRESULT' || txType === 'APPROVEVOTE') && !topicAddress) {
      throw new TypeError('topicAddress needs to be defined');
    }
    if (txType === 'APPROVEVOTE' && !oracleAddress) {
      throw new TypeError('oracleAddress needs to be defined');
    }

    // Skip approve if enough allowance
    let txType = type;
    if (txType === 'APPROVECREATEEVENT') {
      const addressManager = getContractMetadata().AddressManager.address;
      if (await Utils.isAllowanceEnough(senderAddress, addressManager, amount)) {
        txType = 'CREATEEVENT';
      }
    } else if (txType === 'APPROVESETRESULT') {
      if (await Utils.isAllowanceEnough(senderAddress, topicAddress, amount)) {
        txType = 'SETRESULT';
      }
    } else if (txType === 'APPROVEVOTE') {
      if (await Utils.isAllowanceEnough(senderAddress, topicAddress, amount)) {
        txType = 'VOTE';
      }      
    }

    if (txType.startsWith('APPROVE')) {
      costsArr.push(getApproveObj(token, amount));
    }

    const costsArr = [];
    switch (txType) {
      case 'APPROVECREATEEVENT':
      case 'CREATEEVENT': {
        costsArr.push({
          type: 'createEvent',
          gasLimit: Config.CREATE_CORACLE_GAS_LIMIT,
          gasCost: Config.CREATE_CORACLE_GAS_LIMIT * Config.DEFAULT_GAS_PRICE,
          token,
          amount,
        });
        break;
      }
      case 'BET': {
        costsArr.push({
          type: 'bet',
          gasLimit: Config.DEFAULT_GAS_LIMIT,
          gasCost: DEFAULT_GAS_COST,
          token,
          amount,
        });
        break;
      }
      case 'APPROVESETRESULT':
      case 'SETRESULT': {
        costsArr.push({
          type: 'setResult',
          gasLimit: Config.CREATE_DORACLE_GAS_LIMIT,
          gasCost: Config.CREATE_DORACLE_GAS_LIMIT * Config.DEFAULT_GAS_PRICE,
          token,
          amount,
        });
        break;
      }
      case 'APPROVEVOTE':
      case 'VOTE': {
        costsArr.push({
          type: 'vote',
          gasLimit: await Utils.getVotingGasLimit(db.Oracles, oracleAddress, optionIdx, amount),
          gasCost: gasLimit * Config.DEFAULT_GAS_PRICE,
          token,
          amount,
        });
        break;
      }
      case 'FINALIZERESULT': {
        costsArr.push({
          type: 'finalizeResult',
          gasLimit: Config.DEFAULT_GAS_LIMIT,
          gasCost: DEFAULT_GAS_COST,
        });
        break;
      }
      case 'WITHDRAW': {
        costsArr.push({
          type: 'withdraw',
          gasLimit: Config.DEFAULT_GAS_LIMIT,
          gasCost: DEFAULT_GAS_COST,
        });
        break;
      }
      case 'WITHDRAWESCROW': {
        costsArr.push({
          type: 'withdrawEscrow',
          gasLimit: Config.DEFAULT_GAS_LIMIT,
          gasCost: DEFAULT_GAS_COST,
        });
        break;
      }
      case 'TRANSFER': {
        costsArr.push({
          type: 'transfer',
          gasLimit: Config.DEFAULT_GAS_LIMIT,
          gasCost: DEFAULT_GAS_COST,
          token,
          amount,
        });
        break;
      }
      default: {
        throw new Error(`Invalid transactionType: ${transactionType}`);
      }
    }

    return costsArr;
  },
};

module.exports = Transaction;
