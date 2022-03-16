const { Connection, Client, connections } = require('../lib/connection');
const { test, expect } = require('@jest/globals');
const { sessionService } = require('../lib/session');
const { logger } = require('../lib/logger');
const { ConnectionError, ERRORS } = require('../lib/error');

beforeAll( () => {
  sessionService.restoreSession = jest.fn( ( { username } ) => { return { username } } );
  logger.error = jest.fn( () => {} );
} );

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

test( 'ClientСheckConnection_ReturnTrue_ConnectionsHasProperClientsConnection', async () => {
  const client = new Client();
  connections.set(client, { connection: {} });
  expect(client.checkConnection()).toEqual(true);
} );

test( 'ClientСheckConnection_ReturnFalse_ConnectionsHasNoClientsConnection', async () => {
  const client = new Client();
  expect(client.checkConnection()).toEqual(false);
} );

test( 'ClientСheckConnection_ReturnFalse_ConnectionsHasNotProperClientsConnection', async () => {
  const client = new Client();
  connections.set(client, {});
  expect(client.checkConnection()).toEqual(false);
} );

test( 'ClientStartSession_ThrowError_ConnectionsHasNoClientsConnection', async () => {
  const client = new Client();
  const promise = client.startSession({});
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
} );

test( 'ClientStartSession_ThrowError_ConnectionsHasNoStartUserSessionMethod', async () => {
  const client = new Client();
  connections.set(client, {});
  const promise = client.startSession({});
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
} );

test( 'ClientStartSession_CallConnectionStartUserSession_ProperConnectionExists', async () => {
  const client = new Client();
  const startUserSession = jest.fn( () => {} );
  connections.set(client, { startUserSession });
  await client.startSession({});
  expect( startUserSession.mock.calls.length ).toEqual(1);
} );

test( 'ClientDeleteSession_ThrowError_ConnectionsHasNoClientsConnection', async () => {
  const client = new Client();
  const promise = client.deleteSession({});
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
} );

test( 'ClientDeleteSession_ThrowError_ConnectionsHasNoDeleteUserSessionMethod', async () => {
  const client = new Client();
  connections.set(client, {});
  const promise = client.deleteSession({});
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
} );

test( 'ClientDeleteSession_CallConnectionDeleteUserSession_ProperConnectionExists', async () => {
  const client = new Client();
  const deleteUserSession = jest.fn( () => {} );
  connections.set(client, { deleteUserSession });
  await client.deleteSession({});
  expect( deleteUserSession.mock.calls.length ).toEqual(1);
} );

test( 'ConnectionInitialise_CallClientSetUser_SessionExists', async () => {
  const connection = new Connection( { username: 'username' }, {} );
  connection.client.setUser = jest.fn( () => {} );
  await connection.initialise();
  expect( connection.client.setUser.mock.calls.length ).toEqual(1);
} );

test( 'ConnectionInitialise_NotCallClientSetUser_SessionNotExists', async () => {
  const connection = new Connection( {}, {} );
  connection.client.setUser = jest.fn( () => {} );
  await connection.initialise();
  expect( connection.client.setUser.mock.calls.length ).toEqual(0);
} );

test( 'ConnectionValidateStructure_ThrowError_InvalidJSON', async () => {
  const connection = new Connection( {}, {} );
  const invalidJSON = { some: 'json' };
  expect( () => connection.validateStructure(invalidJSON) ).toThrowError('The JSON sent is not a valid Request object.');
} );

test( 'ConnectionValidateStructure_ReturnUndefined_ValidJSON', async () => {
  const connection = new Connection( {}, {} );
  const validJSON = { jsonrpc: '2.0', method: '', id: 0, params: {} };
  expect( connection.validateStructure(validJSON) ).toBeUndefined();
} );

test( 'ConnectionParseJSON_ReturnObject_ValidJSON', async () => {
  const connection = new Connection( {}, {} );
  const validJSON = JSON.stringify( { jsonrpc: '2.0', method: '', id: 0, params: {} } );
  expect( connection.parseJSON(validJSON) ).toEqual({ jsonrpc: '2.0', method: '', id: 0, params: {} });
} );

test( 'ConnectionParseJSON_ThrowError_InvalidJSON', async () => {
  const connection = new Connection( {}, {} );
  expect( () => connection.parseJSON("{invalid: json") ).toThrowError('Invalid JSON was received by the server.');
} );

test( 'ConnectionError_NoDataAdded_ErrorHasNoDataProperty', async () => {
  const connection = new Connection( {}, {} );
  const error = {message: 'test-message', code: 'test-code'};
  connection.send = jest.fn( () => {} );
  await connection.error( error, 2 );
  expect( connection.send.mock.calls[0][0] ).toEqual( { jsonrpc: '2.0', id: 2, error: {message: 'test-message', code: 'test-code'} } );
} );

test( 'ConnectionError_DataTypeNotAnObject_ErrorHasNoDataProperty', async () => {
  const connection = new Connection( {}, {} );
  const types = [ 'string data', 12, true, null, undefined, Symbol('sym'), 12n, () => {} ];
  connection.send = jest.fn( () => {} );
  for ( const type of types ) {
    await connection.error( {message: 'test-message', code: 'test-code', data: type}, 2 );
    expect( connection.send.mock.calls[0][0] ).toEqual( { jsonrpc: '2.0', id: 2, error: {message: 'test-message', code: 'test-code'} } );
    connection.send.mock.calls = [];
  }
} );

test( 'ConnectionError_DataAdded_ErrorHasDataPropertyObjectOrArray', async () => {
  const connection = new Connection( {}, {} );
  const types = [ { data: 'data' }, ['data1', 'data2'] ];
  connection.send = jest.fn( () => {} );
  for ( const type of types ) {
    await connection.error( {message: 'test-message', code: 'test-code', data: type}, 2 );
    expect( connection.send.mock.calls[0][0] ).toEqual( { jsonrpc: '2.0', id: 2, error: {message: 'test-message', code: 'test-code', data: type} } );
    connection.send.mock.calls = [];
  }
} );

test( 'ConnectionError_IdNull_NoIdProvided', async () => {
  const connection = new Connection( {}, {} );
  const error = {message: 'test-message', code: 'test-code'};
  connection.send = jest.fn( () => {} );
  await connection.error( error);
  expect( connection.send.mock.calls[0][0] ).toEqual( { jsonrpc: '2.0', id: null, error: {message: 'test-message', code: 'test-code'} } );
} );

test( 'ConnectionMessage_CallConnectionErrorWithThrowedError_OnErrorAndErrorPassIsTrue', async () => {
  const connection = new Connection( {}, {} );
  const error = new Error('test-message');
  error.pass = true;
  connection.parseJSON = jest.fn( () => { throw error } );
  connection.error = jest.fn( () => {} );
  await connection.message();
  expect( connection.error.mock.calls[0][0] ).toEqual( error );
} );

test( 'ConnectionMessage_CallConnectionErrorWithInternalErrorAndThrowError_OnErrorAndErrorPassIsNotTrue', async () => {
  const connection = new Connection( {}, {} );
  connection.parseJSON = jest.fn( () => { throw new Error('test-message') } );
  connection.error = jest.fn( () => {} );
  const promise = connection.message();
  await expect(promise).rejects.toThrowError('test-message');
  expect( connection.error.mock.calls[0][0] ).toEqual( new ConnectionError(ERRORS.INTERNAL_ERROR) );
} );

test( 'ConnectionCallProcedure_ThrowError_ConnectionModulesHasNoModuleWithModuleName', async () => {
  const connection = new Connection( {}, {} );
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).rejects.toThrowError('The method does not exist / is not available.');
} );

test( 'ConnectionCallProcedure_ThrowError_NoInstanceFoundInModule', async () => {
  const connection = new Connection( {}, {} );
  connection.modules = { some: {} };
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).rejects.toThrowError('The method does not exist / is not available.');
} );

test( 'ConnectionCallProcedure_ThrowError_InstanceHasNoMethod', async () => {
  const connection = new Connection( {}, {} );
  connection.modules = { some: { instance: {} } };
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).rejects.toThrowError('The method does not exist / is not available.');
} );

test( 'ConnectionCallProcedure_ThrowError_ParamsForMethodIsNotValid', async () => {
  const connection = new Connection( {}, {} );
  connection.modules = { some: { instance: { method: () => {} }, validators: { method: { params: () => { return false } } } } };
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).rejects.toThrowError('Invalid method parameter(s).');
} );

test( 'ConnectionCallProcedure_ThrowError_MethodIsNotPublicCientHasNoUsername', async () => {
  const connection = new Connection( {}, {} );
  connection.modules = {
    some:
    {
      instance: { method: () => {} },
      validators:
      {
        method: { params: () => { return true } }
      },
      schema: { method: { public: false } }
    }
  };
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).rejects.toThrowError('Authentication credentials required.');
} );

test( 'ConnectionCallProcedure_ThrowError_UserHasNoProperRole', async () => {
  const connection = new Connection( {}, {} );
  connection.client.user = { username: 'username', role: 'role' };
  connection.modules = {
    some:
    {
      instance: { method: () => {} },
      validators:
      {
        method: { params: () => { return true } }
      },
      schema: { method: { public: true, roles: [ 'needRole' ] } }
    }
  };
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).rejects.toThrowError('Permission denied.');
} );

test( 'ConnectionCallProcedure_ThrowError_InvalidResult', async () => {
  const connection = new Connection( {}, {} );
  connection.client.user = { username: 'username', role: 'role' };
  connection.modules = {
    some:
    {
      instance: { method: () => {} },
      validators:
      {
        method: { params: () => { return true }, result: () => { return false } }
      },
      schema: { method: { public: true, roles: [] } }
    }
  };
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).rejects.toThrowError(`Invalid response. From some/method. Recieve {}.`);
} );

test( 'ConnectionCallProcedure_ReturnResult_MethodIsNotPublicCientHasUsername', async () => {
  const connection = new Connection( {}, {} );
  connection.client.user = { username: 'username', role: 'role' };
  connection.modules = {
    some:
    {
      instance: { method: () => {} },
      validators:
      {
        method: { params: () => { return true }, result: () => { return true } }
      },
      schema: { method: { public: false, roles: [] } }
    }
  };
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).resolves.toEqual({});
} );

test( 'ConnectionCallProcedure_ReturnResult_UserHasProperRole', async () => {
  const connection = new Connection( {}, {} );
  connection.client.user = { username: 'username', role: 'role' };
  connection.modules = {
    some:
    {
      instance: { method: () => {} },
      validators:
      {
        method: { params: () => { return true }, result: () => { return true } }
      },
      schema: { method: { public: true, roles: [ 'role' ] } }
    }
  };
  const promise = connection.callProcedure( 'some', 'method', {} );
  await expect(promise).resolves.toEqual({});
} );
