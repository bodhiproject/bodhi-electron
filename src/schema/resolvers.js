const _ = require('lodash');
const { PubSub } = require('graphql-subscriptions');
const fetch = require('node-fetch');

function buildTopicFilters({ OR = [], address, status }) {
  const filter = (address || status) ? {} : null;
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
    allTopics: async(root, { filter, first, skip, orderBy }, { mongo: { Topics } }) => {
      let query = filter ? { $or: buildTopicFilters(filter) } : {};
      const cursor = Topics.find(query);
      if (first) {
        cursor.limit(first);
      }

      if (skip) {
        cursor.skip(skip);
      }

      return await cursor.toArray();
    },

    allOracles: async(root, { filter, orderBy, limit, skip }, { mongo: { Oracles } }) => {
      let query = filter ? { $or: buildOracleFilters(filter) } : {};

      const options = {};

      if (limit) {
        options.limit(limit);
      }

      if (skip) {
        options.skip(skip);
      }

      if (!_.isEmpty(orderBy)) {
        options.sort = [];

        _.each(orderBy, (order) => {
          options.sort.push([order.field, (order.direction === "ASC" ? 'asc' : 'desc')]);
        });
      }

      return await Oracles.find(query, options).toArray();
    },

    searchOracles: async(root, { searchPhrase, first, skip, orderBy }, { mongo: { Oracles } }) => {
      let query = searchPhrase ? { $or: buildSearchOracleFilter(searchPhrase) } : {};
      const cursor = Oracles.find(query);
      if (first) {
        cursor.limit(first);
      }

      if (skip) {
        cursor.skip(skip);
      }
      return await cursor.toArray();
    },

    allVotes: async(root, { filter, first, skip, orderBy }, { mongo: { Votes } }) => {
      let query = filter ? { $or: buildVoteFilters(filter) } : {};
      const cursor = Votes.find(query);
      if (first) {
        cursor.limit(first);
      }

      if (skip) {
        cursor.skip(skip);
      }
      return await cursor.toArray();
    },

    allBlocks: async(root, { filter, first, skip, orderBy }, { mongo: { Blocks } }) => {
      let query = filter ? { $or: buildBlockFilters(filter) } : {};
      const cursor = Blocks.find(query);
      if (first) {
        cursor.limit(first);
      }

      if (skip) {
        cursor.skip(skip);
      }
      return await cursor.toArray();
    },

    syncInfo: async(root, {}, { mongo: { Blocks } }) => {
      let options = {
        "limit": 1,
        "sort": [
          ["blockNum", 'desc']
        ]
      }
      let syncBlockNum = null;
      let blocks;
      try {
        blocks = await Blocks.find({}, options).toArray();
      } catch (err) {
        console.error(`Error query latest block from db: ${err.message}`);
      }

      if (blocks.length > 0) {
        syncBlockNum = blocks[0].blockNum;
      }

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