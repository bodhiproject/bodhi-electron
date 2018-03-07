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
  type: _TransactionType!
  status: _TransactionStatus!
  txid: String
  createdTime: String!
  blockNum: Int
  blockTime: String
  gasUsed: Int
  version: Int!
  senderAddress: String!
  receiverAddress: String
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
  topic: Topic
}

type Block {
  blockNum: Int!
  blockTime: String!
}

type syncInfo {
  syncBlockNum: Int
  syncBlockTime: String
  chainBlockNum: Int
}

type Query {
  allTopics(filter: TopicFilter, orderBy: [Order!], limit: Int, skip: Int): [Topic]!
  allOracles(filter: OracleFilter, orderBy: [Order!], limit: Int, skip: Int ): [Oracle]!
  searchOracles(searchPhrase: String, orderBy: [Order!], limit: Int, skip: Int): [Oracle]!
  allVotes(filter: VoteFilter, orderBy: [Order!], limit: Int, skip: Int): [Vote]!
  allTransactions(filter: TransactionFilter, orderBy: [Order!], limit: Int, skip: Int): [Transaction]!
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

input TransactionFilter {
  OR: [TransactionFilter!]
  type: _TransactionType
  status: _TransactionStatus
  topicAddress: String
  oracleAddress: String
  senderAddress: String
  senderQAddress: String
}

type Mutation {
  createTopic(
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
    topicAddress: String!
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
    topicAddress: String!
    oracleAddress: String!
  ): Transaction

  withdraw(
    version: Int!
    senderAddress: String!
    topicAddress: String!
  ): Transaction

  transfer(
    senderAddress: String!
    receiverAddress: String!
    token: _TokenType!
    amount: String!
  ): Transaction
}

type Subscription {
  onSyncInfo : syncInfo
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
  RESETAPPROVE
  FINALIZERESULT
  WITHDRAW
  TRANSFER
}

enum _TransactionStatus {
   PENDING
   FAIL
   SUCCESS
}
`;

// Generate the schema object from your types definition.
module.exports = makeExecutableSchema({ typeDefs, resolvers });
