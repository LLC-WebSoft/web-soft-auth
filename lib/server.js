const { createServer } = require('http');
const { UserService } = require('./user');
const { SessionService } = require('./session');
const { Database } = require('./db');
const { validator } = require('./validator');
const { ERRORS, ConnectionError } = require('./error');
const { HTTPConnection } = require('./http-connection');
const { receiveBody } = require('./utils');

const db = new Database();

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
          params: validator.compile(moduleObject.schema[methodName].params),
          result: validator.compile(moduleObject.schema[methodName].result)
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

module.exports = {
  Server
};
