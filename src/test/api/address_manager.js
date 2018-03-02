const _ = require('lodash');
const Chai = require('chai');
const ChaiAsPromised = require('chai-as-promised');

const AddressManager = require('../../api/address_manager');
const Mocks = require('./mock/address_manager');

Chai.use(ChaiAsPromised);
const assert = Chai.assert;
const expect = Chai.expect;

describe('AddressManager', () => {
  describe('getLastEventFactoryIndex()', () => {
    it('returns the lastEventFactoryIndex', () => {
      const res = Mocks.getLastEventFactoryIndex.result;
      assert.isDefined(res.lastEventFactoryIndex);
      assert.isTrue(_.isNumber(Number(res.lastEventFactoryIndex)));
    });

    it('throws if senderAddress is undefined', () => {
      expect(AddressManager.getLastEventFactoryIndex()).to.be.rejectedWith(Error);
    });
  });

  describe('getLastOracleFactoryIndex()', () => {
    it('returns the lastOracleFactoryIndex', async () => {
      const res = Mocks.getLastOracleFactoryIndex.result;
      assert.isDefined(res.lastOracleFactoryIndex);
      assert.isTrue(_.isNumber(Number(res.lastOracleFactoryIndex)));
    });

    it('throws if senderAddress is undefined', () => {
      expect(AddressManager.getLastOracleFactoryIndex()).to.be.rejectedWith(Error);
    });
  });
});
