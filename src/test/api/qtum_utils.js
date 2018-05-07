const Chai = require('chai');
const ChaiAsPromised = require('chai-as-promised');

const QtumUtils = require('../../api/qtum_utils');

Chai.use(ChaiAsPromised);
const assert = Chai.assert;
const expect = Chai.expect;

describe('QtumUtils', () => {
  const realAddress = 'd78f96ea55ad0c8a283b6d759f39cda34a7c5b10';
  const fakeAddress = 'd78f96ea55ad0c8a283b6d759f39cda312345678';

  describe('isValidQtumAddress()', () => {
    it('asserts address to be valid qtum address', () => {
      assert.isTrue(QtumUtils.isValidQtumAddress(realAddress));
    });

    it('asserts address to be invalid qtum address', () => {
      assert.isFalse(QtumUtils.isValidQtumAddress(fakeAddress));
    });

    it('returns a tx receipt', () => {
      const res = Mocks.approve.result;
      assert.isTrue(ContractUtils.isTxReceipt(res));
    });

    it('throws if address is undefined', () => {
      expect(QtumUtils.isValidQtumAddress()).to.be.rejectedWith(Error);
    });
  });
});
