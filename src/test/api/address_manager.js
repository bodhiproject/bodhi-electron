const _ = require('lodash');
const Chai = require('chai');
const ChaiAsPromised = require('chai-as-promised');

const AddressManager = require('../../api/address_manager');
const TestConfig = require('./config/test_config');

Chai.use(ChaiAsPromised);
const assert = Chai.assert;
const expect = Chai.expect;

describe('AddressManager', () => {
  describe('getLastEventFactoryIndex()', () => {
    it('returns the lastEventFactoryIndex', async () => {
      const res = await AddressManager.getLastEventFactoryIndex({
        senderAddress: TestConfig.SENDER_ADDRESS,
      });
      assert.isDefined(res.lastEventFactoryIndex);
      assert.isTrue(_.isNumber(Number(res.lastEventFactoryIndex)));
    });

    it('throws if senderAddress is undefined', () => {
      expect(AddressManager.getLastEventFactoryIndex()).to.be.rejectedWith(Error);
    });
  });

  describe('getLastOracleFactoryIndex()', () => {
    it('returns the lastOracleFactoryIndex', async () => {
      const res = await AddressManager.getLastOracleFactoryIndex({
        senderAddress: TestConfig.SENDER_ADDRESS,
      });
      assert.isDefined(res.lastOracleFactoryIndex);
      assert.isTrue(_.isNumber(Number(res.lastOracleFactoryIndex)));
    });

    it('throws if senderAddress is undefined', () => {
      expect(AddressManager.getLastOracleFactoryIndex()).to.be.rejectedWith(Error);
    });
  });
});
