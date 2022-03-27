const { test, expect } = require('@jest/globals');
const { getWSConnection } = require('./prepare');

test('WSConnection_CallDestroy_OnConnectionCloseEvent', () => {
  const connection = getWSConnection();
  connection.connection.emit('close');
  expect(connection.destroy.mock.calls.length).toEqual(1);
});

test('WSConnection_CallMessage_OnConnectionMessageEventAndInitialisedTrue', () => {
  const connection = getWSConnection();
  connection.initialised = true;
  connection.connection.emit('message');
  expect(connection.message.mock.calls.length).toEqual(1);
});

test('WSConnection_SubscribeOnInitialisedEvent_OnConnectionMessageEventAndInitialisedFalse', () => {
  const connection = getWSConnection();
  connection.on = jest.fn();
  connection.connection.emit('message');
  expect(connection.on.mock.calls[0][0]).toContain('initialised');
});

test('WSConnection_CallMessage_OnMessageEventAndInitialiseEvent', () => {
  const connection = getWSConnection();
  connection.connection.emit('message');
  connection.emit('initialised');
  expect(connection.message.mock.calls.length).toEqual(1);
});
