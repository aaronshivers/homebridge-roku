/* eslint-env jest */

'use strict';

const nodeSSDP = jest.genMockFromModule('node-ssdp');
const { EventEmitter } = require('events');

const HEADERS = {};

class RokuClient extends EventEmitter {
  search(key) {
    setImmediate(() => {
      this.emit('response', HEADERS[key]);
    });
  }
}

function __setResponseHeaders(key, headers) {
  HEADERS[key] = headers;
}

nodeSSDP.RokuClient = RokuClient;
nodeSSDP.__setResponseHeaders = __setResponseHeaders;

module.exports = nodeSSDP;
