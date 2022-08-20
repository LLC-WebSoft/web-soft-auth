'use strict';

const { ERRORS } = require('./error');

const schema = {
  getModules: {
    description: 'Return server api schema.',
    public: true,
    result: {
      description: 'Object with api schema.',
      additionalProperties: true
    }
  },

  getErrors: {
    description: 'Return error dictionary from server.',
    public: true,
    result: {
      description: 'Dictionary of server possible errors.',
      additionalProperties: true
    }
  }
};

const getIntrospectionModule = (modules) => {
  class Introspection {
    getModules() {
      const result = { introspection: schema };
      for (const moduleName in modules) {
        result[moduleName] = { ...modules[moduleName].schema };
      }
      return result;
    }

    getErrors() {
      return ERRORS;
    }
  }
  return {
    introspection: {
      Module: Introspection,
      schema
    }
  };
};

module.exports = {
  getIntrospectionModule
};
