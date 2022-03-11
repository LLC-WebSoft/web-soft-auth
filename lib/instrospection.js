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
  class Introscpection {
    getModules() {
      const result = { introscpection: schema };
      for (const moduleName in modules) {
        result[moduleName] = { ...modules[moduleName].schema };
      }
      return result;
    }
  }
  return {
    Module: Introscpection,
    schema
  };
};

module.exports = {
  getIntrospectionModule
};
