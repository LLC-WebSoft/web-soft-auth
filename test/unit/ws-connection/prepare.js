const { EventEmitter } = require('events');
const { WSConnectionFactory } = require('../../../lib/ws-connection');

jest.mock('../../../lib/connection', () => {
  const { EventEmitter } = require('events');
  class Connection extends EventEmitter {}
  return {
    Connection
  };
});

class FakeConnection extends EventEmitter {}

const getFakeConnection = () => {
  const connection = new FakeConnection();
  return connection;
};

const getWSConnection = () => {
  const factory = new WSConnectionFactory();
  const connection = getFakeConnection();
  const result = factory.create({}, {}, connection);
  result.destroy = jest.fn();
  result.message = jest.fn();
  return result;
};

module.exports = {
  getWSConnection
};
