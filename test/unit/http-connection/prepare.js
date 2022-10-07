const { HTTPConnectionFactory } = require('../../../lib/http-connection');

const createFakeRequest = (origin = '') => {
  const result = {};
  result.headers = {};
  result.headers.origin = origin;
  return result;
};

const createFakeResponse = ({ writableEnded = false, headersSent = false }) => {
  const result = {};
  result.on = jest.fn();
  result.writableEnded = writableEnded;
  result.headersSent = headersSent;
  result.writeHead = jest.fn();
  result.end = jest.fn();
  return result;
};

const createConnection = (request, modules = {}, response) => {
  if (!request) request = createFakeRequest();
  if (!response) response = createFakeResponse({});
  const factory = new HTTPConnectionFactory();
  const connection = factory.create(request, modules, response);
  return connection;
};

module.exports = {
  createConnection,
  createFakeRequest,
  createFakeResponse
};
