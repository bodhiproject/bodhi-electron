const Transactions = {
  
  transactionCost(args) {
    const {
      transactionType, // string
      token, // string
      amount, // number
    } = args;

    if (!transactionType)) {
      throw new TypeError('transactionType needs to be defined');
    }

    const costsArr = [];
    switch (transactionType) {
      case 'APPROVECREATEEVENT': {
        break;
      }
      case 'CREATEEVENT': {
        break;
      }
      case 'BET': {
        break;
      }
      case 'APPROVESETRESULT': {
        break;
      }
      case 'SETRESULT': {
        break;
      }
      case 'APPROVEVOTE': {
        break;
      }
      case 'VOTE': {
        break;
      }
      case 'FINALIZERESULT': {
        break;
      }
      case 'WITHDRAW': {
        break;
      }
      case 'WITHDRAWESCROW': {
        break;
      }
      case 'TRANSFER': {
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
