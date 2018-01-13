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
    filter.address = { $eq: `${address}` };
  }

  if (status) {
    filter.status = { $eq: `${status}` };
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildTopicFilters(OR[i]));
  }

  return filters;
}

function buildOracleFilters({ OR = [], address, topicAddress, resultSetterQAddress, status, token }) {
  const filter = (address || topicAddress || status || token) ? {} : null;
  if (address) {
    filter.address = { $eq: `${address}` };
  }

  if (topicAddress) {
    filter.topicAddress = { $eq: `${topicAddress}` };
  }

  if (resultSetterQAddress) {
    filter.resultSetterQAddress = { $eq: `${resultSetterQAddress}` };
  }

  if (status) {
    filter.status = { $eq: `${status}` };
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
    filter.address = { $eq: `${address}` };
  }

  if (oracleAddress) {
    filter.oracleAddress = { $eq: `${oracleAddress}` };
  }

  if (voterAddress) {
    filter.voterAddress = { $eq: `${voterAddress}` };
  }

  if (voterQAddress) {
    filter.voterQAddress = { $eq: `${voterQAddress}` };
  }

  if (optionIdx) {
    filter.optionIdx = { $eq: `${optionIdx}` };
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildVoteFilters(OR[i]));
  }
  return filters;
}

function buildBlockFilters({ OR = [], hash, blockNum }) {
  const filter = (hash || blockNum) ? {} : null;
  if (hash) {
    filter.hash = { $eq: `${hash}` };
  }

  if (blockNum) {
    filter.blockNum = { $eq: `${blockNum}` };
  }

  let filters = filter ? [filter] : [];
  for (let i = 0; i < OR.length; i++) {
    filters = filters.concat(buildBlockFilters(OR[i]));
  }
  return filters;
}


module.exports = {
  Query: {
    allTopics: async(root, { filter, orderBy, limit, skip }, { mongo: { Topics } }) => {
      const query = filter ? { $or: buildTopicFilters(filter) } : {};
      const options = buildQueryOptions(orderBy, limit, skip);

      return await Topics.find(query, options).toArray();

    },

    allOracles: async(root, { filter, orderBy, limit, skip }, { mongo: { Oracles } }) => {
      const query = filter ? { $or: buildOracleFilters(filter) } : {};
      const options = buildQueryOptions(orderBy, limit, skip);

      return await Oracles.find(query, options).toArray();
    },

    searchOracles: async(root, { searchPhrase, orderBy, limit, skip }, { mongo: { Oracles } }) => {
      const query = searchPhrase ? { $or: buildSearchOracleFilter(searchPhrase) } : {};
      const options = buildQueryOptions(orderBy, limit, skip);

      return await Oracles.find(query, options).toArray();
    },

    allVotes: async(root, { filter, orderBy, limit, skip }, { mongo: { Votes } }) => {
      const query = filter ? { $or: buildVoteFilters(filter) } : {};
      const options = buildQueryOptions(orderBy, limit, skip);

      return await Votes.find(query, options).toArray();
    },

    allBlocks: async(root, { filter, orderBy, limit, skip }, { mongo: { Blocks } }) => {
      const query = filter ? { $or: buildBlockFilters(filter) } : {};
      const options = buildQueryOptions(orderBy, limit, skip);

      return await Blocks.find(query, options).toArray();
    },

    syncInfo: async(root, {}, { mongo: { Blocks } }) => {

      // Build options to find the latest blockNum
      const options = {
        "limit": 1,
        "sort": [
          ["blockNum", 'desc']
        ]
      };

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
    createTopic: async(root, data, { mongo: { Topics } }) => {
      data.status = 'CREATED';
      data.qtumAmount = Array(data.options.length).fill(0);
      data.botAmount = Array(data.options.length).fill(0);

      const response = await Topics.insert(data);
      const newTopic = Object.assign({ id: response.insertedIds[0] }, data);

      pubsub.publish('Topic', { Topic: { mutation: 'CREATED', node: newTopic } });
      return newTopic;
    },

    createOracle: async(root, data, { mongo: { Oracles } }) => {
      data.status = 'CREATED';
      data.amounts = Array(data.options.length).fill(0);

      const response = await Oracles.insert(data);
      const newOracle = Object.assign({ id: response.insertedIds[0] }, data);

      return newOracle;
    },

    createVote: async(root, data, { mongo: { Votes } }) => {
      const response = await Votes.insert(data);
      return Object.assign({ id: response.insertedIds[0] }, data);
    }
  },

  Topic: {
    oracles: async({ address }, data, { mongo: { Oracles } }) => {
      return await Oracles.find({ topicAddress: address }).toArray();
    }
  },

  Subscription: {
    Topic: {
      subscribe: () => pubsub.asyncIterator('Topic'),
    },
  },
};