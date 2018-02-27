const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

// Define your types here.
const typeDefs = `

type Topic {
  txid: String!
  version: Int!
  blockNum: Int
  status: _OracleStatusType!
  address: String
  name: String!
  options: [String!]!
  resultIdx: Int
  qtumAmount: [String!]!
  botAmount: [String!]!
  oracles: [Oracle]
}

type Oracle {
  txid: String!
  version: Int!
  blockNum: Int
  status: _OracleStatusType!
  address: String
  topicAddress: String
  resultSetterAddress: String
  resultSetterQAddress: String
  token: String!
  name: String!
  options: [String!]!
  optionIdxs: [Int!]!
  amounts: [String!]!
  resultIdx: Int
  startTime: String!
  endTime: String!
  resultSetStartTime: String
  resultSetEndTime: String
  consensusThreshold: String
}

type Vote {
  txid: String!
  version: Int!
  blockNum: Int!
  voterAddress: String!
  voterQAddress: String!
  oracleAddress: String!
  optionIdx: Int!
  amount: String!
}

type Transaction {
  version: Int!
  txid: String
  blockNum: Int
  gasUsed: Int
  createdTime: String!
  type: _TransactionType!
  status: _TransactionStatus!
  senderAddress: String!
  senderQAddress: String!
  topicAddress: String
  oracleAddress: String
  name: String
  options: [String!]
  resultSetterAddress: String
  bettingStartTime: String
  bettingEndTime: String
  resultSettingStartTime: String
  resultSettingEndTime: String
  optionIdx: Int
  token: _TokenType
  amount: String
}

type Block {
  blockNum: Int!
  blockTime: String!
}

type syncInfo {
  syncBlockNum: Int
  syncBlockTime: Int
  chainBlockNum: Int
}

type Query {
  allTopics(filter: TopicFilter, orderBy: [Order!], limit: Int, skip: Int): [Topic]!
  allOracles(filter: OracleFilter, orderBy: [Order!], limit: Int, skip: Int ): [Oracle]!
  searchOracles(searchPhrase: String, orderBy: [Order!], limit: Int, skip: Int): [Oracle]!
  allVotes(filter: VoteFilter, orderBy: [Order!], limit: Int, skip: Int): [Vote]!
  allTransactions(orderBy: [Order!], limit: Int, skip: Int): [Transaction]!
  syncInfo: syncInfo!
}

input TopicFilter {
  OR: [TopicFilter!]
  address: String
  status: _OracleStatusType
}

input OracleFilter {
  OR: [OracleFilter!]
  address: String
  topicAddress: String
  resultSetterAddress: String
  resultSetterQAddress: String
  status: _OracleStatusType
  token: _TokenType
}

input VoteFilter {
  OR: [VoteFilter!]
  address: String
  oracleAddress: String
  voterAddress: String
  voterQAddress: String
  optionIdx: Int
}

type Mutation {
  createTopic(
    version: Int!
    senderAddress: String!
    name: String!
    options: [String!]!
    resultSetterAddress: String!
    bettingStartTime: String!
    bettingEndTime: String!
    resultSettingStartTime: String!
    resultSettingEndTime: String!
  ): Transaction

  createBet(
    version: Int!
    senderAddress: String!
    oracleAddress: String!
    optionIdx: Int!
    amount: String!
  ): Transaction

  setResult(
    version: Int!
    senderAddress: String!
    topicAddress: String!
    oracleAddress: String!
    amount: String!
    optionIdx: Int!
  ): Transaction

  createVote(
    version: Int!
    senderAddress: String!
    topicAddress: String!
    oracleAddress: String!
    optionIdx: Int!
    amount: String!
  ): Transaction

  finalizeResult(
    version: Int!
    senderAddress: String!
    oracleAddress: String!
  ): Transaction

  withdraw(
    version: Int!
    senderAddress: String!
    topicAddress: String!
  ): Transaction
}

type Subscription {
  OnSyncInfo : syncInfo
}

input topicSubscriptionFilter {
  mutation_in: [_ModelMutationType!]
}

input Order {
  field: String!
  direction: _OrderDirection!
}

type TopicSubscriptionPayload {
  mutation: _ModelMutationType!
  node: Topic
}

enum _ModelMutationType {
  CREATED
  UPDATED
  DELETED
}

enum _OracleStatusType {
  CREATED
  VOTING
  WAITRESULT
  OPENRESULTSET
  PENDING
  WITHDRAW
}

enum _TokenType {
  QTUM
  BOT
}

enum _OrderDirection {
  DESC
  ASC
}

enum _TransactionType {
  CREATEEVENT
  BET
  APPROVESETRESULT
  SETRESULT
  APPROVEVOTE
  VOTE
  FINALIZERESULT
  WITHDRAW
}

enum _TransactionStatus {
   PENDING
   FAIL
   SUCCESS
}
`;

// Generate the schema object from your types definition.
module.exports = makeExecutableSchema({ typeDefs, resolvers });
