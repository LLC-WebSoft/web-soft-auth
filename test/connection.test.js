const { Connection, Client, connections } = require('../lib/connection');
const { test, expect } = require('@jest/globals');

beforeEach( () => {
  connections.clear();
} );

test( 'ClientEmit_ThrowError_NoConnection', async () => {
  const client = new Client();
  const promise = client.emit('test-event', { test: 'test' });
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
} );

test( 'ClientEmit_ThrowError_ConnectionHasNoConnectionProperty', async () => {
  const client = new Client();
  connections.set(client, {});
  const promise = client.emit('test-event', { test: 'test' });
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
} );

test( 'ClientEmit_CallConnectionSendProperData_ConnectionsHasProperConncection', async () => {
  const client = new Client();
  const send = jest.fn( () => {} );
  connections.set(client, { connection: true, send });
  await client.emit('test-event', { test: 'test' });
  expect( send.mock.calls.length ).toEqual(1);
  expect( send.mock.calls[0][0] ).toEqual( {jsonrpc: '2.0', result: { event: 'test-event', data: { test: 'test' } }} );
} );

test( 'ClientСheckConnection_ReturnTrue_ConnectionsHasClientsConnection', async () => {
  const client = new Client();
  connections.set(client, {});
  expect(client.checkConnection()).toEqual(true);
} );

test( 'ClientСheckConnection_ReturnFalse_ConnectionsHasNoClientsConnection', async () => {
  const client = new Client();
  expect(client.checkConnection()).toEqual(false);
} );
