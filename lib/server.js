const { createServer } = require('http');
const { Auth } = require('./auth');
const { UserService } = require('./user');
const { SessionService } = require('./session');
const { Database } = require('./db');
const Ajv = require('ajv');

const ajv = new Ajv();
const db = new Database();

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

const receiveBody = async (req) => {
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers);
};

const compileJSONSchema = (object) => {
  return ajv.compile({
    type: 'object',
    additionalProperties: false,
    ...object
  });
};

class Server {
  constructor(modules, config) {
    this.modules = this.buildModules(modules);
    this.config = config;
    this.sessionService = new SessionService(db);
    this.userService = new UserService(db);
    this.server = {};
    this.initialise();
  }

  initialise() {
    const { port, host } = this.config;
    this.server = createServer(this.listener.bind(this));
    this.server.on('listening', () => {
      console.log(`Listen ${host}:${port}.`);
    });
    this.server.listen(port, host);
  }

  async listener(request, response) {
    const connection = new HTTPConnection(request, this.modules, response);
    try {
      await this.request(connection);
    } catch (error) {
      if (error instanceof ConnectionError) {
        connection.error(error);
      } else {
        connection.error(new ConnectionError(ERRORS.INTERNAL_ERROR, 'Internal server error.'));
        throw error;
      }
    }
  }

  async request(connection) {
    const { request } = connection;
    if (request.method !== 'OPTIONS') {
      if (request.method === 'POST') {
        const body = await receiveBody(request);
        await connection.initialise(this.sessionService, this.userService);
        await connection.message(body);
      } else {
        throw new ConnectionError(ERRORS.BAD_REQUEST, 'Request method must be POST.', { method: request.method });
      }
    } else {
      connection.options();
    }
  }

  buildModules(modules) {
    const result = {};
    for (const moduleName in modules) {
      const moduleObject = {
        instance: new modules[moduleName].Module(),
        schema: this.buildSchema(modules[moduleName].schema),
        validators: {}
      };
      for (const methodName in moduleObject.schema) {
        moduleObject.validators[methodName] = {
          params: compileJSONSchema(moduleObject.schema[methodName].params),
          result: compileJSONSchema(moduleObject.schema[methodName].result)
        };
      }
      result[moduleName] = moduleObject;
    }
    return result;
  }

  buildSchema(moduleSchema = {}) {
    const result = {};
    for (const methodName in moduleSchema) {
      result[methodName] = {
        params: moduleSchema[methodName].params || {},
        result: moduleSchema[methodName].result || {},
        public: !!moduleSchema[methodName].public,
        roles: moduleSchema[methodName].roles || []
      };
    }
    return result;
  }
}

const server = new Server(modules, { port: 80, host: 'localhost' });
