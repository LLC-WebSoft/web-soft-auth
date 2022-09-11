const { test, expect } = require('@jest/globals');
jest.enableAutomock();
const { ModulesFactory } = require('../../../lib/modules-factory');
jest.unmock('../../../lib/modules-factory');

test('ModulesFactoryCreate_ReturnEmptyObject_EmprySchemaPassed', () => {
  const factory = new ModulesFactory();
  const result = factory.create({});
  expect(result).toEqual({});
});

test('ModulesFactoryCreate_ThrowError_NoModulePropertyInSchema', () => {
  const factory = new ModulesFactory();
  const modules = {
    test: {
      schema: {}
    }
  };
  const wrapper = () => {
    factory.create(modules);
  };
  expect(wrapper).toThrowError();
});

test('ModulesFactoryCreate_ReturnModulesWithDefaults_EmptySchemaPassed', () => {
  const factory = new ModulesFactory();
  class Test {}
  const modules = {
    test: {
      schema: {},
      Module: Test
    }
  };
  const result = factory.create(modules);
  const expected = {
    test: {
      schema: {},
      instance: new Test(),
      validators: {}
    }
  };
  expect(result).toEqual(expected);
});

test('ModulesFactoryCreate_ReturnModulesWithDefaults_SchemaNotPassed', () => {
  const factory = new ModulesFactory();
  class Test {}
  const modules = {
    test: {
      schema: {},
      Module: Test
    }
  };
  const result = factory.create(modules);
  const expected = {
    test: {
      schema: {},
      instance: new Test(),
      validators: {}
    }
  };
  expect(result).toEqual(expected);
});

test('ModulesFactoryCreate_ReturnModulesMethodWithDefaults_EmptyMethodPassed', () => {
  const factory = new ModulesFactory();
  class Test {}
  const modules = {
    test: {
      schema: {
        testMethod: {}
      },
      Module: Test
    }
  };
  const result = factory.create(modules);
  const expected = {
    test: {
      schema: {
        testMethod: {
          params: {},
          result: {},
          public: false,
          roles: [],
          emit: {}
        }
      },
      instance: new Test(),
      validators: {
        testMethod: {
          params: undefined,
          result: undefined
        }
      }
    }
  };
  expect(result).toEqual(expected);
});

test('ModulesFactoryCreate_RewriteDefaultValues_ValuesPassed', () => {
  const factory = new ModulesFactory();
  class Test {}
  const modules = {
    test: {
      schema: {
        testMethod: {
          public: true,
          roles: ['test']
        }
      },
      Module: Test
    }
  };
  const result = factory.create(modules);
  const expected = {
    test: {
      schema: {
        testMethod: {
          params: {},
          result: {},
          public: true,
          roles: ['test'],
          emit: {}
        }
      },
      instance: new Test(),
      validators: {
        testMethod: {
          params: undefined,
          result: undefined
        }
      }
    }
  };
  expect(result).toEqual(expected);
});
