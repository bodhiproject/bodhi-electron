const chai = require('chai');
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const apiRouter = require('../../route/api');

const expect = chai.expect;

let server;
let routes;

describe('API Routes', () => {
  before(() => {
    server = require('../../index').server;
    apiRouter.applyRoutes(server);
    routes = server.routes;
  });

  describe('POST', () => {
    it('should have the is-connected route', () => {
      expect(routes).to.have.property('postisconnected');
    });

    it('should have the validate-address route', () => {
      expect(routes).to.have.property('postvalidateaddress');
    });

    it('should have the get-account-address route', () => {
      expect(routes).to.have.property('postgetaccountaddress');
    });

    it('should have the get-transaction route', () => {
      expect(routes).to.have.property('postgettransaction');
    });

    it('should have the wallet-passphrase route', () => {
      expect(routes).to.have.property('postwalletpassphrase');
    });

    it('should have the wallet-lock route', () => {
      expect(routes).to.have.property('postwalletlock');
    });

    it('should have the encrypt-wallet route', () => {
      expect(routes).to.have.property('postencryptwallet');
    });

    it('should have the wallet-passphrase-change route', () => {
      expect(routes).to.have.property('postwalletpassphrasechange');
    });

    it('should have the backup-wallet route', () => {
      expect(routes).to.have.property('postbackupwallet');
    });

    it('should have the import-wallet route', () => {
      expect(routes).to.have.property('postimportwallet');
    });

    it('should have the get-block route', () => {
      expect(routes).to.have.property('postgetblock');
    });

    it('should have the get-block-hash route', () => {
      expect(routes).to.have.property('postgetblockhash');
    });

    it('should have the get-transaction-receipt route', () => {
      expect(routes).to.have.property('postgettransactionreceipt');
    });

    it('should have the search-logs route', () => {
      expect(routes).to.have.property('postsearchlogs');
    });

    it('should have the event-escrow-amount route', () => {
      expect(routes).to.have.property('posteventescrowamount');
    });

    it('should have the last-event-factory-index route', () => {
      expect(routes).to.have.property('postlasteventfactoryindex');
    });

    it('should have the last-oracle-factory-index route', () => {
      expect(routes).to.have.property('postlastoraclefactoryindex');
    });

    it('should have the approve route', () => {
      expect(routes).to.have.property('postapprove');
    });

    it('should have the allowance route', () => {
      expect(routes).to.have.property('postallowance');
    });

    it('should have the bot-balance route', () => {
      expect(routes).to.have.property('postbotbalance');
    });

    it('should have the version route', () => {
      expect(routes).to.have.property('postversion');
    });

    it('should have the get-result route', () => {
      expect(routes).to.have.property('postgetresult');
    });

    it('should have the bet-balances route', () => {
      expect(routes).to.have.property('postbetbalances');
    });

    it('should have the vote-balances route', () => {
      expect(routes).to.have.property('postvotebalances');
    });

    it('should have the total-bets route', () => {
      expect(routes).to.have.property('posttotalbets');
    });

    it('should have the total-votes route', () => {
      expect(routes).to.have.property('posttotalvotes');
    });

    it('should have the create-topic route', () => {
      expect(routes).to.have.property('postcreatetopic');
    });

    it('should have the event-factory-version route', () => {
      expect(routes).to.have.property('posteventfactoryversion');
    });

    it('should have the withdraw route', () => {
      expect(routes).to.have.property('postwithdraw');
    });

    it('should have the withdraw-escrow route', () => {
      expect(routes).to.have.property('postwithdrawescrow');
    });

    it('should have the total-qtum-value route', () => {
      expect(routes).to.have.property('posttotalqtumvalue');
    });

    it('should have the total-bot-value route', () => {
      expect(routes).to.have.property('posttotalbotvalue');
    });

    it('should have the final-result route', () => {
      expect(routes).to.have.property('postfinalresult');
    });

    it('should have the status route', () => {
      expect(routes).to.have.property('poststatus');
    });

    it('should have the did-withdraw route', () => {
      expect(routes).to.have.property('postdidwithdraw');
    });

    it('should have the winnings route', () => {
      expect(routes).to.have.property('postwinnings');
    });

    it('should have the event-address route', () => {
      expect(routes).to.have.property('posteventaddress');
    });

    it('should have the consensus-threshold route', () => {
      expect(routes).to.have.property('postconsensusthreshold');
    });

    it('should have the finished route', () => {
      expect(routes).to.have.property('postfinished');
    });

    it('should have the bet route', () => {
      expect(routes).to.have.property('postbet');
    });

    it('should have the set-result route', () => {
      expect(routes).to.have.property('postsetresult');
    });

    it('should have the oracle route', () => {
      expect(routes).to.have.property('postoracle');
    });

    it('should have the bet-start-block route', () => {
      expect(routes).to.have.property('postbetstartblock');
    });

    it('should have the bet-end-block route', () => {
      expect(routes).to.have.property('postbetendblock');
    });

    it('should have the result-set-start-block route', () => {
      expect(routes).to.have.property('postresultsetstartblock');
    });

    it('should have the result-set-end-block route', () => {
      expect(routes).to.have.property('postresultsetendblock');
    });

    it('should have the vote route', () => {
      expect(routes).to.have.property('postvote');
    });

    it('should have the finalize-result route', () => {
      expect(routes).to.have.property('postfinalizeresult');
    });

    it('should have the arbitration-end-block route', () => {
      expect(routes).to.have.property('postarbitrationendblock');
    });

    it('should have the last-result-index route', () => {
      expect(routes).to.have.property('postlastresultindex');
    });
  });

  describe('GET', () => {
    it('should have the get-wallet-info route', () => {
      expect(routes).to.have.property('getgetwalletinfo');
    });

    it('should have the list-address-groupings route', () => {
      expect(routes).to.have.property('getlistaddressgroupings');
    });

    it('should have the list-unspent route', () => {
      expect(routes).to.have.property('getlistunspent');
    });

    it('should have the get-blockchain-info route', () => {
      expect(routes).to.have.property('getgetblockchaininfo');
    });

    it('should have the get-block-count route', () => {
      expect(routes).to.have.property('getgetblockcount');
    });
  });
});
