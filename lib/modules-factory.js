'use strict';

const { validator } = require('./validator');
const defaultMethodSchema = {
  params: {},
  result: {},
  public: false,
  roles: [],
  emit: {}
};

class ModulesFactory {
  create(modules) {
    const result = {};
    for (const moduleName in modules) {
      const module = modules[moduleName];
      const instance = this.createInstance(module);
      const schema = this.createSchema(module.schema);
      const validators = this.createValidators(schema);
      result[moduleName] = { instance, schema, validators };
    }
    return result;
  }

  createInstance({ Module }) {
    if (!Module) throw new Error('Schema syntax error. Module property is not defined.');
    const instance = new Module();
    return instance;
  }

  createValidators(schema) {
    const validators = {};
    for (const methodName in schema) {
      const method = schema[methodName];
      validators[methodName] = {
        params: validator.compile(method.params),
        result: validator.compile(method.result)
      };
    }
    return validators;
  }

  createSchema(moduleSchema = {}) {
    const result = {};
    for (const methodName in moduleSchema) {
      const method = moduleSchema[methodName];
      result[methodName] = { ...defaultMethodSchema, ...method };
    }
    return result;
  }
}

module.exports = {
  ModulesFactory
};
