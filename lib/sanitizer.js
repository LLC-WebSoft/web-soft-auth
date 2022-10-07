'use strict';

const { filterXSS } = require('xss');

class Sanitizer {
  constructor() {
    this.filter = filterXSS;
  }

  setFilter(filter) {
    if (typeof filter !== 'function') throw new Error('Filter must be a function.');
    this.filter = filter;
  }

  sanitize(string) {
    return this.filter(string);
  }
}

module.exports = {
  sanitizer: new Sanitizer(),
  Sanitizer
};
