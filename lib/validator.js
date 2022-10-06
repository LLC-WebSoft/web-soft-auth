'use strict';
const Ajv = require('ajv');
const ajv = new Ajv();

class Validator {
  compile(schema) {
    return ajv.compile({
      type: 'object',
      additionalProperties: false,
      ...schema
    });
  }
}

module.exports = {
  validator: new Validator(),
  Validator
};
