const { ERRORS, ConnectionError } = require('./error');
const { validator } = require('./validator');
const { sessionService } = require('./session');
const { userService } = require('./user');

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

class Connection {
  constructor(request, modules) {
    this.request = request;
    this.modules = modules;
    this.session = {};
    this.user = {};
  }

  async initialise() {
    this.session = await sessionService.restoreSession(this.request);
    if (this.session.username) {
      this.user = await userService.getByUsername(this.session.username);
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

module.exports = {
  Connection
};
