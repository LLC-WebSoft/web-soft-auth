jest.enableAutomock();
const { Server } = require('../../lib/server');
const { getIntrospectionModule } = require('../../lib/instrospection');
const { connections } = require('../../lib/connection');
const { logger } = require('../../lib/logger');
jest.unmock('../../lib/server');
jest.unmock('../../lib/error');

jest.mock('../../lib/http-connection', () => {
  class HTTPConnectionFactory {}
  return {
    HTTPConnectionFactory
  };
});

jest.mock('../../lib/ws-connection', () => {
  class WSConnectionFactory {}
  return {
    WSConnectionFactory
  };
});

jest.mock('../../lib/connection', () => {
  return {
    connections: new Map()
  };
});

jest.mock('http', () => {
  const { EventEmitter } = require('events');
  class TestNodeServer extends EventEmitter {
    constructor(listener) {
      super();
      this.listener = listener;
    }
    listen() {}
    emitRequest(request = {}) {
      return this.listener(request, {});
    }
  }
  return {
    createServer: (listener) => {
      return new TestNodeServer(listener);
    }
  };
});

jest.mock('ws', () => {
  const { EventEmitter } = require('events');
  class TestWSServer extends EventEmitter {
    constructor() {
      super();
    }
  }
  return {
    Server: TestWSServer
  };
});

beforeEach(() => {
  getIntrospectionModule.mockClear();
  connections.clear();
});

//Factory function for server creation.
const createServer = (config = {}, connectionMock = {}) => {
  const server = new Server(config);
  const createConnection = () => {
    return connectionMock;
  };
  server.modulesFactory.create = jest.fn(() => {
    return {};
  });
  server.httpFactory.create = jest.fn(createConnection);
  server.wsFactory.create = jest.fn(createConnection);
  server.server.close = jest.fn();
  return server;
};

//Factory function for connection creation.
const createFakeConnection = (method = 'POST') => {
  const result = {};
  result.error = jest.fn();
  result.initialise = jest.fn();
  result.message = jest.fn();
  result.setCors = jest.fn();
  result.options = jest.fn();
  result.request = createStubRequest(method);
  connections.set(1, result);
  return result;
};

//Facatory function for request stub creation.
const createStubRequest = (method) => {
  const result = { method };
  result.connection = {};
  result.connection.destroy = jest.fn();
  return result;
};

module.exports = {
  createServer,
  createFakeConnection,
  createStubRequest,
  logger,
  getIntrospectionModule
};
