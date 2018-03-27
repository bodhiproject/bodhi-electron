const Chai = require('chai');
const ChaiAsPromised = require('chai-as-promised');
const _ = require('lodash');
const Utils = require('qweb3').Utils;

const Wallet = require('../../api/wallet');

Chai.use(ChaiAsPromised);
const assert = Chai.assert;
const expect = Chai.expect;

describe('Wallet', () => {
  describe('getAccountAddress()', () => {
    it('returns a qtum address', async () => {
      const res = await Wallet.getAccountAddress({
        accountName: '',
      });
      assert.isDefined(res);
      assert.isString(res);
    });

    it('throws if accountName is undefined', () => {
      expect(Wallet.getAccountAddress()).to.be.rejectedWith(Error);
    });
  });

  describe('getWalletInfo()', () => {
    it('returns the wallet info', async () => {
      const res = await Wallet.getWalletInfo();
      assert.isDefined(res);
      assert.isDefined(res.walletversion);
      assert.isDefined(res.balance);
      assert.isDefined(res.stake);
      assert.isDefined(res.unconfirmed_balance);
      assert.isDefined(res.immature_balance);
      assert.isDefined(res.txcount);
      assert.isDefined(res.keypoololdest);
      assert.isDefined(res.keypoolsize);
      assert.isDefined(res.paytxfee);
      assert.isDefined(res.hdmasterkeyid);
    });
  });

  describe('listAddressGroupings()', () => {
    it('returns the array of address groupings', async () => {
      const res = await Wallet.listAddressGroupings();
      assert.isDefined(res);
      assert.isArray(res);

      if (!_.isEmpty(res)) {
        const innerArr = res[0];
        assert.isArray(innerArr);

        if (!_.isEmpty(innerArr)) {
          const item = innerArr[0];
          assert.isTrue(Utils.isQtumAddress(item[0]));
          assert.isTrue(_.isNumber(item[1]));
        }
      }
    });
  });

  describe('listUnspent()', () => {
    it('returns the unspent tx outputs array', async () => {
      const res = await Wallet.listUnspent();
      assert.isDefined(res);
      assert.isArray(res);
    });
  });
});
