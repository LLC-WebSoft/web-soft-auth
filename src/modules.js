class Example {
  method() {
    return 'Hello!';
  }
}

module.exports = {
  example: {
    schema: {
      method: {
        description: 'Test method for example.',
        public: true,
        params: {
          description: 'Params for test method.',
          required: ['param1'],
          properties: {
            param1: {
              type: 'Number',
              description: 'Param1 is number.'
            }
          }
        }
      }
    },
    Module: Example
  }
};
