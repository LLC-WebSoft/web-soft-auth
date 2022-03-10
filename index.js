const { Server } = require('./lib/server');
const { Auth } = require('./lib/auth');

const modules = {
  auth: {
    schema: {
      register: {
        public: true,
        description: 'Регистрация',
        params: {
          required: ['username', 'password'],
          properties: {
            username: {
              type: 'string',
              description: 'Имя пользователя'
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
        },
        transport: 'http'
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
        },
        transport: 'http'
      },
      logout: {
        public: false,
        transport: 'http'
      },
      me: {
        public: false,
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

const server = new Server(modules, { port: 80, host: 'localhost', cors: false });
