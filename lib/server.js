const { createServer } = require('http');
const { validator } = require('./validator');
const { ERRORS, ConnectionError } = require('./error');
const { HTTPConnection } = require('./http-connection');
const { WSConnection } = require('./ws-connection');
const { connections } = require('./connection');
const { receiveBody, delay } = require('./utils');
const { logger } = require('./logger');
const ws = require('ws');
const { getIntrospectionModule } = require('./instrospection');

const SERVER_CLOSE_TIMEOUT = 500;

class Server {
  constructor(modules, config) {
    this.modules = this.buildModules({ ...modules, introspection: getIntrospectionModule(modules) });
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
    if (this.config.cors === false) connection.setCors(false);
    try {
      await this.request(connection);
    } catch (error) {
      if (error.pass && error.pass === true) {
        connection.error(error);
        logger.error(error);
      } else {
        connection.error(new ConnectionError(ERRORS.INTERNAL_ERROR));
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
        throw new ConnectionError(ERRORS.INVALID_HTTP_METHOD);
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

  closeConnections() {
    for (const connection of connections.values()) {
      if (connection.connection) {
        connection.connection.terminate();
      } else {
        connection.error(new ConnectionError(ERRORS.SERVICE_UNAVAILABEL));
        connection.request.connection.destroy();
      }
    }
  }

  async close() {
    this.server.close((error) => {
      if (error) logger.error(error);
    });
    await delay(SERVER_CLOSE_TIMEOUT);
    if (connections.size !== 0) {
      this.closeConnections();
    }
  }
}

module.exports = {
  Server
};
