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

const JSONRPCSchema = {
  type: 'object',
  required: ['jsonrpc', 'method'],
  properties: {
    jsonrpc: {
      type: 'string',
      pattern: '2.0'
    },
    method: {
      type: 'string'
    },
    id: {
      type: 'number'
    },
    params: {
      type: 'object'
    }
  },
  additionalProperties: false
};

const validateJSONRPC = ajv.compile(JSONRPCSchema);

class Connection {
  constructor(request, modules) {
    this.request = request;
    this.modules = modules;
    this.sessionService = {};
    this.userService = {};
    this.session = {};
    this.user = {};
  }

  async initialise(sessionService, userService) {
    this.sessionService = sessionService;
    this.userService = userService;
    this.session = await this.sessionService.restoreSession(this.request);
    if (this.session.username) {
      this.user = await this.userService.getByUsername(this.session.username);
    }
  }

  startSession(user) {
    if (!this.startUserSession) {
      throw new Error('Method startUserSession is not implemented.');
    }
    return this.startUserSession(user);
  }

  deleteSession() {
    if (!this.deleteUserSession) {
      throw new Error('Method deleteUserSession is not implemented.');
    }
    return this.deleteUserSession();
  }

  async message(buffer) {
    const data = this.parseJSON(buffer);
    this.validateStructure(data);
    const [moduleName, methodName] = data.method.split('/');
    const result = await this.callProcedure(moduleName, methodName, data.params);
    this.send(result);
  }

  async error(error, id = null) {
    const data = { jsonrpc: '2.0', id, error: { code: error.code, message: error.message } };
    if (error.data && typeof error.data === 'object') {
      data.error.data = error.data;
    }
    this.send(data);
  }

  async callProcedure(moduleName, methodName, params = {}) {
    const { instance, validators, schema } = this.modules[moduleName];
    if (!instance || !instance[methodName]) {
      throw new ConnectionError(ERRORS.METHOD_NOT_FOUND, 'The method does not exist / is not available.', {
        method: `${moduleName}/${methodName}`
      });
    }
    if (!validators[methodName].params(params)) {
      throw new ConnectionError(ERRORS.INVALID_PARAMS, 'Invalid method parameter(s).', { params });
    }

    if (!schema[methodName].public && (!this.session.username || !this.user.username)) {
      throw new ConnectionError(ERRORS.UNAUTHORIZED, 'Authentication credentials required.');
    }
    if (schema[methodName].roles.length && !schema[methodName].roles.includes(this.user.role)) {
      throw new ConnectionError(ERRORS.FORBIDDEN, ' Permission denied.');
    }
    const result = (await instance[methodName](params, this)) || {};
    if (!validators[methodName].result(result)) {
      throw new Error(`Invalid response. From ${moduleName}/${methodName}. Recieve ${JSON.stringify(result)}.`);
    }
    return result;
  }

  validateStructure(data) {
    if (!validateJSONRPC(data)) {
      throw new ConnectionError(ERRORS.INVALID_REQUEST, 'The JSON sent is not a valid Request object.');
    }
  }

  parseJSON(buffer) {
    try {
      return JSON.parse(buffer);
    } catch {
      throw new ConnectionError(ERRORS.PARSE_ERROR, 'Invalid JSON was received by the server.');
    }
  }
}

const MIME_TYPES = {
  json: 'application/json'
};

const HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

class HTTPConnection extends Connection {
  constructor(request, modules, response) {
    super(request, modules);
    this.response = response;
  }

  write(data, type = 'json') {
    if (!this.response.writableEnded) {
      const mimeType = MIME_TYPES[type];
      this.response.writeHead(200, { ...HEADERS, 'Content-Type': mimeType });
      this.response.end(data);
    }
  }

  send(data) {
    this.write(JSON.stringify(data), 'json');
  }

  options() {
    if (!this.response.headersSent) {
      this.response.writeHead(200, HEADERS);
      this.response.end();
    }
  }

  async startUserSession(user) {
    this.session = await this.sessionService.startSession(this.request, this.response, user.username);
    this.user = user;
  }

  async deleteUserSession() {
    await this.sessionService.endSession(this.request, this.response);
    this.session = {};
    this.user = {};
  }
}

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
