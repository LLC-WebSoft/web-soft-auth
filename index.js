const { Server } = require('./lib/server');
const { Auth } = require('./lib/auth');

const clients = new Set();
let counter = 0;

setInterval(async () => {
  counter++;
  for (const client of clients) {
    try {
      await client.emit('counter/getCounts', { counter });
    } catch (error) {
      clients.delete(client);
    }
  }
}, 2000);

class Counter {
  getCounts(data, client) {
    clients.add(client);
  }
}

const modules = {
  counter: {
    schema: {
      getCounts: {
        description: 'Получение обновляемого счётчика.',
        public: true,
        emit: {
          description: 'Объект события',
          required: ['counter', 'proper'],
          properties: {
            counter: {
              type: 'Number',
              description: 'Счётчик'
            },
            proper: {
              type: 'object',
              description: 'Ещё одно свойство',
              required: ['prop1'],
              properties: {
                prop1: {
                  type: 'number',
                  description: 'Ещё одно свойство внутри!'
                }
              }
            }
          }
        }
      }
    },
    Module: Counter
  },
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
