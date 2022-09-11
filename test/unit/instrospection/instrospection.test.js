const { test, expect } = require('@jest/globals');
const { getIntrospectionModule } = require('../../../lib/instrospection');

test('IntrospectionGetModules_ReturnObjectWithSchemas_ModulesPassed', async () => {
  const { Module } = getIntrospectionModule({ testModule: { schema: { testMethod: {} } } }).introspection;
  const introspection = new Module();
  const result = {
    introspection: {
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
    },
    testModule: {
      testMethod: {}
    }
  };
  expect(introspection.getModules()).toEqual(result);
});
