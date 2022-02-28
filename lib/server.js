const { createServer } = require('http');
const { Auth } = require('./auth');
const { UserService } = require('./user');
const { SessionService } = require('./session');
const { Database } = require('./db');
const Ajv = require('ajv');

const ajv = new Ajv();
const db = new Database();
const sessionService = new SessionService(db);
const userService = new UserService(db);
const auth = new Auth();

const routing = {
  auth: {
    schema: {
      register: {
        params: {
          required: ['username', 'password'],
          properties: {
            username: 'string',
            password: 'string'
          }
        },
        result: {
          required: ['username', 'role', 'createdTime'],
          properties: {
            username: 'string',
            role: 'string',
            createdTime: 'string'
          }
        }
      },
      login: {
        params: {
          required: ['username', 'password'],
          properties: {
            username: 'string',
            password: 'string'
          }
        },
        result: {
          required: ['username', 'role', 'createdTime'],
          properties: {
            username: 'string',
            role: 'string',
            createdTime: 'string'
          }
        }
      },
      logout: {
        result: {
          required: ['username'],
          properties: {
            username: 'string'
          }
        }
      },
      changePassword: {
        params: {
          required: ['username', 'oldPassword', 'newPassword'],
          properties: {
            username: 'string',
            oldPassword: 'oldPassword',
            newPassword: 'newPassword'
          }
        },
        result: {
          required: ['username', 'role', 'createdTime'],
          properties: {
            username: 'string',
            role: 'string',
            createdTime: 'string'
          }
        }
      }
    },
    module: Auth
  }
};

const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602
};

class JSONRPCError extends Error {
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

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

class JSONRPCChannel {
  constructor(request, response, modules) {
    this.request = request;
    this.response = response;
    this.modules = modules;
    this.sessionService = null;
    this.userService = null;
    this.session = null;
    this.user = null;
  }

  async initialise(sessionService, userService) {
    this.sessionService = sessionService;
    this.userService = userService;
    this.session = await this.sessionService.restoreSession(this.request);
    this.user = await this.userService.getByUsername(this.session.username);
  }

  async startSession(username) {
    this.session = await this.sessionService.startSession(this.request, this.response, username);
    this.user = await this.userService.getByUsername(this.session.username);
  }

  message(buffer) {
    const data = this.parseJSON(buffer);
    this.validateStructure(data);
    const [moduleName, methodName] = data.method.split('/');
    this.callProcedure(moduleName, methodName, data.params, data.id);
  }

  callProcedure(moduleName, methodName, params = {}, id = '') {
    const { instance, validators } = this.modules[moduleName];
    if (!instance || !instance[methodName]) {
      throw new JSONRPCError(JSON_RPC_ERRORS.METHOD_NOT_FOUND, 'The method does not exist / is not available.', {
        method: `${moduleName}/${methodName}`
      });
    }
    if (!validators[methodName](params)) {
      throw new JSONRPCError(JSON_RPC_ERRORS.INVALID_PARAMS, 'Invalid method parameter(s).', { params });
    }
  }

  validateStructure(data) {
    if (!validateJSONRPC(data)) {
      throw new JSONRPCError(JSON_RPC_ERRORS.INVALID_REQUEST, 'The JSON sent is not a valid Request object.');
    }
  }

  parseJSON(buffer) {
    try {
      return JSON.parse(buffer);
    } catch {
      throw new JSONRPCError(JSON_RPC_ERRORS.PARSE_ERROR, 'Invalid JSON was received by the server.');
    }
  }
}

const processRequest = async (dataStream, context) => {
  const body = await receiveBody(dataStream);
};

const server = createServer(async (request, response) => {
  const result = await processRequest(request, { request, response });
  response.setHeader(200);
  response.end(result);
});

server.listen(80);
