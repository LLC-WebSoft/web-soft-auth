const { test, expect } = require('@jest/globals');
const { getIntrospectionModule } = require('../../lib/instrospection');

test('IntrospectionGetModules_ReturnObjectWithSchemas_ModulesPassed', async () => {
  const { Module } = getIntrospectionModule({ testModule: { schema: { testMethod: {} } } }).introspection;
  const introspection = new Module();
  const result = {
    introspection: {
      getModules: {
        description: 'Возвращает схему API сервера.',
        public: true,
        result: {
          description: 'Объект со схемой API.',
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
