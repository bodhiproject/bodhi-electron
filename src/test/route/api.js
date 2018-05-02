const chai = require('chai');
const chaiHttp = require('chai-http');
// const app = require('../../index.js');
const should = chai.should();
const expect = chai.expect;
chai.use(chaiHttp);

describe('getBlockCount()', () => {
  it('returns the blockcount', (done) => {
    chai.request('http://localhost:5555')
      .get('/get-block-count')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.result).to.be.a('number');
        done();
      });
  });
});

