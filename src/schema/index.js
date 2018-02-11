const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

// Define your types here.
const typeDefs = `

type Topic {
  version: Int!
  address: String!
  txid: String!
  status: _OracleStatusType!
  name: String!
  options: [String!]!
  resultIdx: Int
  qtumAmount: [String!]!
  botAmount: [String!]!
  blockNum: Int!
  oracles: [Oracle]!
}

type Oracle {
  version: Int!
  address: String!
  txid: String!
  topicAddress: String!
  resultSetterAddress: String
  resultSetterQAddress: String
  status: _OracleStatusType!
  token: String!
  name: String!
  options: [String!]!
  optionIdxs: [Int!]!
  amounts: [String!]!
  resultIdx: Int
  blockNum: Int!
  startTime: Int!
  endTime: Int!
  resultSetStartTime: Int
  resultSetEndTime: Int
  consensusThreshold: String
}

type Vote {
  version: Int!
  txid: String!
  voterAddress: String!
  voterQAddress: String!
  oracleAddress: String!
  optionIdx: Int!
  amount: String!
  blockNum: Int!
}

type Transaction {
  version: Int!
  txid: String
  type: _TransactionType!
  Status: _TransactionStatus!
  approveTxid: String
  senderAddress: String!
  senderQAddress: String!
  EntityId: String
  OptionIdx: Int
  token: _TokenType
  Amount: String
  gasUsed: Int
  blockNum: Int
  blockTime: String
  createTime: String!
  createBlockNum: Int!
}

type Block {
  blockNum: Int!
  blockTime: Int!
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

  setResult(
    version: Int!
    senderAddress: String!
    oracleAddress: String!
    resultIdx: Int!
  ): Transaction

  createBet(
    version: Int!
    senderAddress: String!
    oracleAddress: String!
    amount: Int!
  ): Transaction

  createVote(
    version: Int!
    senderAddress: String!
    oracleAddress: String!
    optionIdx: Int!
    amount: Int!
  ): Transaction

  finalizeResult(
    version: Int!
    senderAddress: String!
    oracleAddrss: String!
  ): Transaction

  withDraw(
    version: Int!
    senderAddress: String!
    topicAddress: String!
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
  VOTE
  SETRESULT
  FINALIZEEVENT
  WITHDRAW
}

enum _TransactionStatus {
   APPROVING
   PENDING
   FAIL
   SUCCESS
}
`;

// Generate the schema object from your types definition.
module.exports = makeExecutableSchema({ typeDefs, resolvers });
