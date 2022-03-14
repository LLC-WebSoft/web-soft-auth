const schema = {
  getModules: {
    description: 'Возвращает схему API сервера.',
    public: true,
    result: {
      description: 'Объект со схемой API.',
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
  }
  return {
    Module: Introspection,
    schema
  };
};

module.exports = {
  getIntrospectionModule
};
