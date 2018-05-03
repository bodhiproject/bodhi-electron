const Transactions = {
  
  async transactionCost(args) {
    const {
      transactionType, // string
      token, // string
      amount, // number
    } = args;

    if (!transactionType)) {
      throw new TypeError('transactionType needs to be defined');
    }

    

    return 
  },
};

module.exports = Transactions;
