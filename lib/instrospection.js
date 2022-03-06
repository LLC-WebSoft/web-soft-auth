const getIntrospectionModule = (modules) => {
  class Introscpection {
    getModules() {
      return { modules };
    }
  }
  return {
    Module: Introscpection,
    schema: {
      getModules: {
        public: true,
        result: {
          required: ['modules'],
          properties: {
            modules: {
              type: 'object'
            }
          },
          additionalProperties: true
        }
      }
    }
  };
};

module.exports = {
  getIntrospectionModule
};
