/* External Import */
const url = require('url');
const fetch = require('node-fetch');
const _ = require('lodash');

/* Internal Import */
const utils = require('./utils');

class HttpProvider {
  constructor(urlString) {
    this.url = url.parse(urlString);
    this.reqId = 0;
  }

  request(params) {
    // Make sure method is defined in params
    utils.paramsCheck('request', params, ['method']);

    // Construct body of request options
    const bodyJson = _.extend({
      id: this.reqId,
      jsonrpc: '1.0',
      method: '',
      params: [],
    }, params);

    // Construct options of request
    const reqOpts = {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(bodyJson),
    };

    // Add Basic Auth header if auth is defined in HttpProvider constructor
    if (this.url.auth) {
      reqOpts.headers.Authorization = `Basic ${Buffer.from(this.url.auth).toString('base64')}`;
    }

    this.reqId += 1;

    // return fetch(`${this.url.href}`, reqOpts)
    return fetch(`${this.url.protocol}//${this.url.host}`, reqOpts)
      .then(this.parseJSON)
      .then(this.checkStatus);
  }

  /**
   * Returns resolved Promise if Http response contains result; otherwise returns rejected upon error.
   *
   * @param  {object} response   JSON response from a HTTP request
   *
   * @return {object|undefined} Returns either the response, or throws an error
   */
  checkStatus(response) {
    // We can rely on checking error object so dont check HTTP status code here.
    if (response.error) {
      console.log(response.result);
      throw new Error(response.error.message);
    } else {
      console.log(response.result);
      return response.result;
    }
  }

  /**
   * Parses the JSON returned by a network request
   *
   * @param  {object} response A response from a network request
   *
   * @return {object}          The parsed JSON from the request
   */
  parseJSON(response) {
    if (response.status === 200) {
      return response.json();
    } else {
      return {
        error: {
          message: response.statusText,
          status: response.status
        }
      }
    }
  }
}

module.exports = HttpProvider;