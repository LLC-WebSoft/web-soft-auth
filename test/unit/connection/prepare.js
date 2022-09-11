const { Client, connections, Connection } = require('../../../lib/connection');

const CORRECT_EVENT_DATA = {
  jsonrpc: '2.0',
  result: { event: 'test-event', data: { test: 'test' } }
};

const CORRECT_JSON = { jsonrpc: '2.0', method: '', id: 0, params: {} };
const CORRECT_JSON_STRING = JSON.stringify(CORRECT_JSON);
const TEST_ERROR = { message: 'test-message', code: 'test-code' };

jest.mock('../../../lib/session', () => {
  return {
    sessionService: {
      restoreSession: jest.fn(({ username }) => {
        return { username };
      })
    }
  };
});

jest.mock('../../../lib/logger', () => {
  return {
    logger: {
      error: jest.fn()
    }
  };
});

beforeEach(() => {
  connections.clear();
});

const createClient = (connection) => {
  const result = new Client();
  connections.set(result, connection);
  return result;
};

const createConnection = (fakeRequest, fakeModules) => {
  const result = new Connection(fakeRequest, fakeModules);
  result.client.setUser = jest.fn();
  result.send = jest.fn();
  return result;
};

module.exports = {
  createClient,
  createConnection,
  CORRECT_EVENT_DATA,
  CORRECT_JSON,
  CORRECT_JSON_STRING,
  TEST_ERROR
};
