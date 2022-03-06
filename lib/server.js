const { createServer } = require('http');
const { validator } = require('./validator');
const { ERRORS, ConnectionError } = require('./error');
const { HTTPConnection } = require('./http-connection');
const { WSConnection } = require('./ws-connection');
const { receiveBody } = require('./utils');
const { logger } = require('./logger');
const ws = require('ws');

class Server {
  constructor(modules, config) {
    this.modules = this.buildModules(modules);
    this.config = config;
    this.server = {};
    this.ws = {};
    this.initialise();
  }

  initialise() {
    const { port, host } = this.config;
    this.server = createServer(this.listener.bind(this));
    this.server.on('listening', () => {
      logger.info(`Server started on ${host}:${port}.`);
      logger.info('Modules available:', Object.keys(this.modules));
    });
    this.ws = new ws.Server({ server: this.server });
    this.ws.on('connection', async (connection, request) => {
      const clientConnection = new WSConnection(request, this.modules, connection);
      await clientConnection.initialise();
    });
    this.server.listen(port, host);
  }

  async listener(request, response) {
    const connection = new HTTPConnection(request, this.modules, response);
    try {
      await this.request(connection);
    } catch (error) {
      logger.error(error);
      if (error.pass && error.pass === true) {
        connection.error(error, error.id);
      } else {
        connection.error(new ConnectionError(ERRORS.INTERNAL_ERROR), error.id);
        throw error;
      }
    }
  }

  async request(connection) {
    const { request } = connection;
    if (request.method !== 'OPTIONS') {
      if (request.method === 'POST') {
        const body = await receiveBody(request);
        await connection.initialise();
        await connection.message(body);
      } else {
        throw new ConnectionError(ERRORS.INVALID_HTTP_METHOD, { method: request.method });
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
