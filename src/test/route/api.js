const chai = require('chai');
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const apiRouter = require('../../route/api');

const expect = chai.expect;

let server;
let routes;

describe('API TESTs', () => {
  before(function(){
    function startRestifyServer(){
      server = restify.createServer({
        title: 'Bodhi Server',
      });
      const cors = corsMiddleware({
        origins: ['*'],
      });
      server.pre(cors.preflight);
      server.use(cors.actual);
      server.use(restify.plugins.bodyParser({ mapParams: true }));
      server.use(restify.plugins.queryParser());
      server.on('after', (req, res, route, err) => {
        if (route) {
          console.debug(`${route.methods[0]} ${route.spec.path} ${res.statusCode}`);
        } else {
          console.error(`${err.message}`);
        }
      });
    }
    startRestifyServer();
    apiRouter.applyRoutes(server);
    routes = server.routes;
  });

  it('post: is-connected', () => {
    expect(routes).to.have.property('postisconnected');
  });

  it('post: get-account-address', () => {
    expect(routes).to.have.property('postgetaccountaddress');
  });

  it('post: get-transaction', () => {
    expect(routes).to.have.property('postgettransaction');
  });

  it('get: get-wallet-info', () => {
    expect(routes).to.have.property('getgetwalletinfo');
  });

  it('get: list-address-groupings', () => {
    expect(routes).to.have.property('getlistaddressgroupings');
  });

  it('get: list-unspent', () => {
    expect(routes).to.have.property('getlistunspent');
  });

  it('post: wallet-passphrase', () => {
    expect(routes).to.have.property('postwalletpassphrase');
  });

  it('post: wallet-lock', () => {
    expect(routes).to.have.property('postwalletlock');
  });

  it('post: encrypt-wallet', () => {
    expect(routes).to.have.property('postencryptwallet');
  });

  it('post: wallet-passphrase-change', () => {
    expect(routes).to.have.property('postwalletpassphrasechange');
  });

  it('post: backup-wallet', () => {
    expect(routes).to.have.property('postbackupwallet');
  });

  it('post: import-wallet', () => {
    expect(routes).to.have.property('postimportwallet');
  });

  it('post: get-block', () => {
    expect(routes).to.have.property('postgetblock');
  });

  it('get: get-blockchain-info', () => {
    expect(routes).to.have.property('getgetblockchaininfo');
  });

  it('get: get-block-count', () => {
    expect(routes).to.have.property('getgetblockcount');
  });

  it('post: get-block-hash', () => {
    expect(routes).to.have.property('postgetblockhash');
  });

  it('post: get-transaction-receipt', () => {
    expect(routes).to.have.property('postgettransactionreceipt');
  });

  it('post: search-logs', () => {
    expect(routes).to.have.property('postsearchlogs');
  });

  it('post: event-escrow-amount', () => {
    expect(routes).to.have.property('posteventescrowamount');
  });

  it('post: last-event-factory-index', () => {
    expect(routes).to.have.property('postlasteventfactoryindex');
  });

  it('post: last-oracle-factory-index', () => {
    expect(routes).to.have.property('postlastoraclefactoryindex');
  });

  it('post: approve', () => {
    expect(routes).to.have.property('postapprove');
  });

  it('post: allowance', () => {
    expect(routes).to.have.property('postallowance');
  });

  it('post: bot-balance', () => {
    expect(routes).to.have.property('postbotbalance');
  });

  it('post: version', () => {
    expect(routes).to.have.property('postversion');
  });

  it('post: get-result', () => {
    expect(routes).to.have.property('postgetresult');
  });

  it('post: bet-balances', () => {
    expect(routes).to.have.property('postbetbalances');
  });

  it('post: vote-balances', () => {
    expect(routes).to.have.property('postvotebalances');
  });

  it('post: total-bets', () => {
    expect(routes).to.have.property('posttotalbets');
  });

  it('post: total-votes', () => {
    expect(routes).to.have.property('posttotalvotes');
  });

  it('post: create-topic', () => {
    expect(routes).to.have.property('postcreatetopic');
  });

  it('post: event-factory-version', () => {
    expect(routes).to.have.property('posteventfactoryversion');
  });

  it('post: withdraw', () => {
    expect(routes).to.have.property('postwithdraw');
  });

  it('post: withdraw-escrow', () => {
    expect(routes).to.have.property('postwithdrawescrow');
  });

  it('post: total-qtum-value', () => {
    expect(routes).to.have.property('posttotalqtumvalue');
  });

  it('post: totalbotvalue', () => {
    expect(routes).to.have.property('posttotalbotvalue');
  });

  it('post: final-result', () => {
    expect(routes).to.have.property('postfinalresult');
  });

  it('post: status', () => {
    expect(routes).to.have.property('poststatus');
  });

  it('post: did-withdraw', () => {
    expect(routes).to.have.property('postdidwithdraw');
  });

  it('post: winnings', () => {
    expect(routes).to.have.property('postwinnings');
  });

  it('post: event-address', () => {
    expect(routes).to.have.property('posteventaddress');
  });

  it('post: consensus-threshold', () => {
    expect(routes).to.have.property('postconsensusthreshold');
  });

  it('post: finished', () => {
    expect(routes).to.have.property('postfinished');
  });

  it('post: bet', () => {
    expect(routes).to.have.property('postbet');
  });

  it('post: set-result', () => {
    expect(routes).to.have.property('postsetresult');
  });

  it('post: oracle', () => {
    expect(routes).to.have.property('postoracle');
  });

  it('post: bet-start-block', () => {
    expect(routes).to.have.property('postbetstartblock');
  });

  it('post: bet-end-block', () => {
    expect(routes).to.have.property('postbetendblock');
  });

  it('post: result-set-start-block', () => {
    expect(routes).to.have.property('postresultsetstartblock');
  });

  it('post: result-set-end-block', () => {
    expect(routes).to.have.property('postresultsetendblock');
  });

  it('post: vote', () => {
    expect(routes).to.have.property('postvote');
  });

  it('post: finalize-result', () => {
    expect(routes).to.have.property('postfinalizeresult');
  });

  it('post: arbitration-end-block', () => {
    expect(routes).to.have.property('postarbitrationendblock');
  });

  it('post: last-result-index', () => {
    expect(routes).to.have.property('postlastresultindex');
  });
});
