'use strict';
const http = require('http');
const ws = require('ws');
const { ModulesFactory } = require('./modules-factory');
const { ERRORS, ConnectionError } = require('./error');
const { HTTPConnectionFactory } = require('./http-connection');
const { WSConnectionFactory } = require('./ws-connection');
const { connections } = require('./connection');
const { receiveBody, delay } = require('./utils');
const { logger } = require('./logger');
const { getIntrospectionModule } = require('./instrospection');

let https = {};
try {
  https = require('https');
} catch (error) {
  logger.warn('Cannot require https module.');
}

const defaultConfig = {
  port: 80,
  host: 'localhost',
  cors: true,
  serverCloseTimeout: 500,
  secure: false,
  key: null,
  cert: null
};

class Server {
  constructor(config) {
    this.config = { ...defaultConfig, ...config };
    this.modulesFactory = new ModulesFactory();
    this.httpFactory = new HTTPConnectionFactory();
    this.wsFactory = new WSConnectionFactory();
    this.modules = {};
    this.server = {};
    this.ws = {};
  }

  start(modules) {
    const introspection = getIntrospectionModule(modules);
    this.modules = this.modulesFactory.create({ ...modules, ...introspection });
    this.initialise();
  }

  initialise() {
    const { port, host } = this.config;
    this.server = this.getHTTPServer();
    this.ws = new ws.Server({ server: this.server });
    this.server.on('listening', this.handleListening.bind(this));
    this.ws.on('connection', this.handleConnection.bind(this));
    this.server.listen(port, host);
  }

  getHTTPServer() {
    if (this.config.secure === true) {
      const { key, cert } = this.config;
      return https.createServer({ key, cert }, this.listen.bind(this));
    } else {
      return http.createServer(this.listen.bind(this));
    }
  }

  async handleConnection(connection, request) {
    const clientConnection = this.wsFactory.create(request, this.modules, connection);
    try {
      await clientConnection.initialise();
    } catch (error) {
      await this.handleError(clientConnection, error);
      await connection.terminate();
    }
  }

  handleListening() {
    const { port, host } = this.config;
    logger.info(`Server started on ${host}:${port}.`);
    logger.info('Modules available:', Object.keys(this.modules));
  }

  async handleError(connection, error) {
    if (error.pass === true) {
      connection.error(error);
      logger.error(error);
    } else {
      connection.error(new ConnectionError(ERRORS.INTERNAL_ERROR));
      throw error;
    }
  }

  async listen(request, response) {
    const connection = this.httpFactory.create(request, this.modules, response);
    if (this.config.cors === false) connection.setCors(false);
    try {
      await this.request(connection);
    } catch (error) {
      await this.handleError(connection, error);
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
    await delay(this.config.serverCloseTimeout);
    if (connections.size !== 0) {
      this.closeConnections();
    }
  }
}

module.exports = {
  Server
};
