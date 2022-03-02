const { Server } = require('./lib/server');
const { Auth } = require('./lib/auth');

const modules = {
  auth: {
    schema: {
      register: {
        public: true,
        params: {
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string'
            },
            password: {
              type: 'string'
            }
          }
        },
        result: {
          required: ['username', 'role', 'createdTime'],
          properties: {
            username: {
              type: 'string'
            },
            role: {
              type: 'string'
            },
            createdTime: {
              type: 'string'
            }
          }
        }
      },
      login: {
        public: true,
        params: {
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string'
            },
            password: {
              type: 'string'
            }
          }
        },
        result: {
          required: ['username', 'role', 'createdTime'],
          properties: {
            username: {
              type: 'string'
            },
            role: {
              type: 'string'
            },
            createdTime: {
              type: 'string'
            }
          }
        }
      },
      logout: {
        public: false
      },
      changePassword: {
        public: false,
        params: {
          required: ['username', 'oldPassword', 'newPassword'],
          properties: {
            username: {
              type: 'string'
            },
            oldPassword: {
              type: 'string'
            },
            newPassword: {
              type: 'string'
            }
          }
        },
        result: {
          required: ['username', 'role', 'createdTime'],
          properties: {
            username: {
              type: 'string'
            },
            role: {
              type: 'string'
            },
            createdTime: {
              type: 'string'
            }
          }
        }
      }
    },
    Module: Auth
  }
};

const server = new Server(modules, { port: 80, host: 'localhost' });
