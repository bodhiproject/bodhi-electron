const _ = require('lodash');
const pubsub = require('../pubsub');
const fetch = require('node-fetch');

/* Default limit number for query page */
const DEFAULT_LIMIT_NUM = 50;
const DEFAULT_SKIP_NUM = 0;

/**
 * Returns an options object to pass in database query
 * @param  {Array} orderBy Array of Order type defined in schema
 * @param  {Number} limit   limit number in paging; default value DEFAULT_LIMIT_NUM
 * @param  {Number} skip    skip number in paging; default value DEFAULT_SKIP_NUM
 * @return {Object}         
 */
function buildQueryOptions(orderBy, limit, skip) {
  const options = {};

  if (!_.isEmpty(orderBy)) {
    options.sort = [];

    _.each(orderBy, (order) => {
      options.sort.push([order.field, (order.direction === "ASC" ? 'asc' : 'desc')]);
    });
  }

  options.limit = limit || DEFAULT_LIMIT_NUM;
  options.skip = skip || DEFAULT_SKIP_NUM;

  return options;
}

function buildTopicFilters({ OR = [], orderBy, limit, skip }) {
  const filter = (order || status) ? {} : null;

  if (address) {
    filter.address = address;
  }

  if (status) {
    filter.status = status;
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildTopicFilters(OR[i]));
  }

  return filters;
}

function buildOracleFilters({OR = [], address, topicAddress, resultSetterQAddress, status}) {
  const filter = (address || topicAddress || status) ? {}: null;
  if(address) {
    filter.address = address;
  }

  if (topicAddress) {
    filter.topicAddress = topicAddress;
  }

  if(resultSetterQAddress){
    filter.resultSetterQAddress = resultSetterQAddress;
  }

  if(status) {
    filter.status = status;
  }

  if (token) {
    filter.token = { $eq: `${token}` };
  }

  let filters = filter ? [filter] : [];

  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildOracleFilters(OR[i]));
  }

  return filters;
}

function buildSearchOracleFilter(searchPhrase) {
  const filterFields = ["name", "address", "topicAddress", "resultSetterAddress", "resultSetterQAddress"];
  if (!searchPhrase) {
    return [];
  }

  filters = [];
  for (let i = 0; i < filterFields.length; i++) {
    const filter = {};
    filter[filterFields[i]] = { $regex: `.*${searchPhrase}.*` };
    filters.push(filter)
  }

  return filters;
}

function buildVoteFilters({ OR = [], address, oracleAddress, voterAddress, voterQAddress, optionIdx }) {
  const filter = (address || oracleAddress || voterAddress || optionIdx) ? {} : null;
  if (address) {
    filter.address = address;
  }

  if (oracleAddress) {
    filter.oracleAddress = oracleAddress;
  }

  if (voterAddress) {
    filter.voterAddress = voterAddress;
  }

  if (voterQAddress) {
    filter.voterQAddress = voterQAddress;
  }

  if (optionIdx) {
    filter.optionIdx = optionIdx;
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildVoteFilters(OR[i]));
  }
  return filters;
}

module.exports = {
  Query: {
    allTopics: async (root, {filter, first, skip, orderBy}, {db: {Topics}}) => {
      let query = filter ? {$or: buildTopicFilters(filter)}: {};
      const cursor = Topics.cfind(query);
      if (first) {
        cursor.limit(first);
      }

      return await cursor.exec();
    },

    allOracles: async (root, {filter, first, skip, orderBy}, {db: {Oracles}}) => {
      let query = filter ? {$or: buildOracleFilters(filter)}: {};
      const cursor = Oracles.cfind(query);
      if (first) {
        cursor.limit(first);
      }

      if (skip) {
        options.skip(skip);
      }
      return await cursor.exec();
    },

    searchOracles: async (root, {searchPhrase, first, skip, orderBy}, {db: {Oracles}}) => {
      let query = searchPhrase ? {$or: buildSearchOracleFilter(searchPhrase)}: {};
      const cursor = Oracles.cfind(query);
      if (first) {
        cursor.limit(first);
      }

      if (skip) {
        cursor.skip(skip);
      }
      return await cursor.exec();
    },

    allVotes: async (root, {filter, first, skip, orderBy}, {db: {Votes}}) => {
      let query = filter ? {$or: buildVoteFilters(filter)}: {};
      const cursor = Votes.cfind(query);
      if (first) {
        cursor.limit(first);
      }

      if (skip) {
        cursor.skip(skip);
      }
      return await cursor.exec();
    },

    allBlocks: async (root, {filter, first, skip, orderBy}, {db: {Blocks}}) => {
      let query = filter ? {$or: buildBlockFilters(filter)}: {};
      const cursor = Blocks.cfind(query);
      if (first) {
        cursor.limit(first);
      }

      if (skip) {
        cursor.skip(skip);
      }
      return await cursor.exec();
    },

    syncInfo: async (root, {}, {db: {Blocks}}) => {
      let syncBlockNum = null;
      let blocks;
      try {
        blocks = await Blocks.cfind({}).sort({blockNum:-1}).limit(1).exec();
      } catch(err){
        console.error(`Error query latest block from db: ${err.message}`);
      }

      const blocks = await Blocks.find({}, options).toArray();

      const syncBlockNum = (!_.isEmpty(blocks) && blocks[0].blockNum) || null;

      let chainBlockNum = null;

      try {
        let resp = await fetch('https://testnet.qtum.org/insight-api/status?q=getInfo');
        let json = await resp.json();

        chainBlockNum = json['info']['blocks'];
      } catch (err) {
        console.error(`Error GET https://testnet.qtum.org/insight-api/status?q=getInfo: ${err.message}`);
      }

      return { 'syncBlockNum': syncBlockNum, 'chainBlockNum': chainBlockNum }
    }
  },

  Mutation: {
    createTopic: async (root, data, {db: {Topics}}) => {
      data.status = 'CREATED';
      data.qtumAmount = Array(data.options.length).fill(0);
      data.botAmount = Array(data.options.length).fill(0);

      const response = await Topics.insert(data);
      const newTopic = Object.assign({ id: response.insertedIds[0] }, data);

      pubsub.publish('Topic', { Topic: { mutation: 'CREATED', node: newTopic } });
      return newTopic;
    },

    createOracle: async (root, data, {db: {Oracles}}) => {
      data.status = 'CREATED';
      data.amounts = Array(data.options.length).fill(0);

      const response = await Oracles.insert(data);
      const newOracle = Object.assign({ id: response.insertedIds[0] }, data);

      return newOracle;
    },

    createVote: async (root, data, {db: {Votes}}) => {
      const response = await Votes.insert(data);
      return Object.assign({ id: response.insertedIds[0] }, data);
    }
  },

  Topic: {
    oracles: async ({address}, data, {db: {Oracles}}) => {
      return await Oracles.find({topicAddress: address});
    }
  },

  Subscription: {
    Topic: {
      subscribe: () => pubsub.asyncIterator('Topic'),
    },
  },
};