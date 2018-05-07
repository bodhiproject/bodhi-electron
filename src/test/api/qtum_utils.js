const Chai = require('chai');
const ChaiAsPromised = require('chai-as-promised');

const QtumUtils = require('../../api/qtum_utils');

Chai.use(ChaiAsPromised);
const assert = Chai.assert;
const expect = Chai.expect;

describe('QtumUtils', () => {
  const realAddress = 'qSzPLfPsHP6ChX2jxEyy8637JiBXtn5piS';
  const fakeAddress = 'qSzPLfPsHP6ChX2jxEyy86371234567890';

  describe('isValidQtumAddress()', () => {
    it('asserts address to be valid qtum address', () => {
      assert.isTrue(QtumUtils.isValidQtumAddress(realAddress));
    });

    it('asserts address to be invalid qtum address', () => {
      assert.isFalse(QtumUtils.isValidQtumAddress(fakeAddress));
    });

    it('throws if address is undefined', () => {
      expect(QtumUtils.isValidQtumAddress()).to.be.rejectedWith(Error);
    });
  });
});
