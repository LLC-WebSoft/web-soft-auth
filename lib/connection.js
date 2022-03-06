const { ERRORS, ConnectionError } = require('./error');
const { validator } = require('./validator');
const { sessionService } = require('./session');
const { userService } = require('./user');
const { logger } = require('./logger');
const { EventEmitter } = require('events');

const JSONRPCSchema = {
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
  }
};

const validateJSONRPC = validator.compile(JSONRPCSchema);

const connections = new Map();

class Client {
  constructor() {
    this.id = 0;
  }
}

class Connection extends EventEmitter {
  constructor(request, modules) {
    super();
    this.request = request;
    this.modules = modules;
    this.session = {};
    this.user = {};
    this.client = new Client();
    this.initialised = false;
  }

  async initialise() {
    this.session = await sessionService.restoreSession(this.request);
    if (this.session.username) {
      this.user = await userService.getByUsername(this.session.username);
    }
    connections.set(this.client, this);
    this.initialised = true;
    this.emit('initialised');
  }

  destroy() {
    connections.delete(this.client);
  }

  startSession(user) {
    if (!this.startUserSession) {
      throw new ConnectionError({ ...ERRORS.BAD_TRASPORT, internal: 'startUserSession in not defined.' });
    }
    return this.startUserSession(user);
  }

  deleteSession() {
    if (!this.deleteUserSession) {
      throw new ConnectionError({ ...ERRORS.BAD_TRASPORT, internal: 'deleteUserSession in not defined.' });
    }
    return this.deleteUserSession();
  }

  async message(buffer) {
    let id = null;
    try {
      const data = this.parseJSON(buffer);
      logger.info(`User:${this.user.username}`, data);
      id = data.id;
      this.validateStructure(data);
      const [moduleName, methodName] = data.method.split('/');
      const result = await this.callProcedure(moduleName, methodName, data.params);
      this.send({ jsonrpc: '2.0', result, id: data.id });
    } catch (error) {
      if (error.pass && error.pass === true) {
        logger.error(error);
        this.error(error, id);
      } else {
        this.error(new ConnectionError(ERRORS.INTERNAL_ERROR), id);
        throw error;
      }
    }
  }

  async error(error, id = null) {
    const data = { jsonrpc: '2.0', id, error: { code: error.code, message: error.message } };
    if (error.data && typeof error.data === 'object') {
      data.error.data = error.data;
    }
    this.send(data);
  }

  async callProcedure(moduleName, methodName, params = {}) {
    if (!this.modules[moduleName]) {
      throw new ConnectionError(ERRORS.METHOD_NOT_FOUND, {
        method: `${moduleName}/${methodName}`
      });
    }
    const { instance, validators, schema } = this.modules[moduleName];
    if (!instance || !instance[methodName]) {
      throw new ConnectionError(ERRORS.METHOD_NOT_FOUND, {
        method: `${moduleName}/${methodName}`
      });
    }
    if (!validators[methodName].params(params)) {
      throw new ConnectionError(ERRORS.INVALID_PARAMS, { params });
    }

    if (!schema[methodName].public && (!this.session.username || !this.user.username)) {
      throw new ConnectionError(ERRORS.UNAUTHORIZED);
    }
    if (schema[methodName].roles.length && !schema[methodName].roles.includes(this.user.role)) {
      throw new ConnectionError(ERRORS.FORBIDDEN);
    }
    const result = (await instance[methodName](params, this)) || {};
    if (!validators[methodName].result(result)) {
      throw new Error(`Invalid response. From ${moduleName}/${methodName}. Recieve ${JSON.stringify(result)}.`);
    }
    return result;
  }

  validateStructure(data) {
    if (!validateJSONRPC(data)) {
      throw new ConnectionError(ERRORS.INVALID_REQUEST);
    }
  }

  parseJSON(buffer) {
    try {
      return JSON.parse(buffer);
    } catch {
      throw new ConnectionError(ERRORS.PARSE_ERROR);
    }
  }
}

module.exports = {
  Connection,
  connections
};
