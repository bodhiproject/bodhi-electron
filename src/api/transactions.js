const Config = require('../config/config');

const DEFAULT_GAS_COST = Config.DEFAULT_GAS_LIMIT * Config.DEFAULT_GAS_PRICE;

const getApproveObj = (token, amount) => {
  type: 'approve',
  gasLimit: Config.DEFAULT_GAS_LIMIT,
  gasCost: DEFAULT_GAS_COST,
  token,
  amount,
};

const Transactions = {
  
  transactionCost(args) {
    const {
      type, // string
      token, // string
      amount, // number
    } = args;

    if (!type)) {
      throw new TypeError('type needs to be defined');
    }

    const costsArr = [];
    switch (type) {
      case 'APPROVECREATEEVENT': {
        costsArr.push(getApproveObj(token, amount));
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
      case 'APPROVESETRESULT': {
        costsArr.push(getApproveObj(token, amount));
        costsArr.push({
          type: 'setResult',
          gasLimit: Config.CREATE_DORACLE_GAS_LIMIT,
          gasCost: Config.CREATE_DORACLE_GAS_LIMIT * Config.DEFAULT_GAS_PRICE,
          token,
          amount,
        });
        break;
      }
      case 'APPROVEVOTE': {
        // TODO: check if voting over threshold
        costsArr.push(getApproveObj(token, amount));
        costsArr.push({
          type: 'vote',
          gasLimit: Config.CREATE_DORACLE_GAS_LIMIT,
          gasCost: Config.CREATE_DORACLE_GAS_LIMIT * Config.DEFAULT_GAS_PRICE,
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

module.exports = Transactions;
