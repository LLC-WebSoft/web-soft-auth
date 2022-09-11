const { test, expect } = require('@jest/globals');
const {
  createClient,
  CORRECT_EVENT_DATA,
  createConnection,
  CORRECT_JSON,
  CORRECT_JSON_STRING,
  TEST_ERROR
} = require('./prepare');

test('ClientEmit_ThrowError_NoConnection', async () => {
  const client = createClient();
  const promise = client.emit('test-event', { test: 'test' });
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
});

test('ClientEmit_ThrowError_ConnectionHasNoConnectionProperty', async () => {
  const client = createClient({});
  const promise = client.emit('test-event', { test: 'test' });
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
});

test('ClientEmit_CallConnectionSendProperData_ConnectionsHasProperConncection', async () => {
  const mockSend = jest.fn(() => {});
  const client = createClient({ connection: {}, send: mockSend });
  await client.emit('test-event', { test: 'test' });
  expect(mockSend.mock.calls[0][0]).toEqual(CORRECT_EVENT_DATA);
});

test('ClientСheckConnection_ReturnTrue_ConnectionsHasProperClientsConnection', async () => {
  const client = createClient({ connection: {} });
  expect(client.checkConnection()).toEqual(true);
});

test('ClientСheckConnection_ReturnFalse_ConnectionsHasNoClientsConnection', async () => {
  const client = createClient();
  expect(client.checkConnection()).toEqual(false);
});

test('ClientСheckConnection_ReturnFalse_ConnectionsHasNotProperClientsConnection', async () => {
  const client = createClient({});
  expect(client.checkConnection()).toEqual(false);
});

test('ClientStartSession_ThrowError_ConnectionsHasNoClientsConnection', async () => {
  const client = createClient();
  const promise = client.startSession({});
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
});

test('ClientStartSession_ThrowError_ConnectionsHasNoStartUserSessionMethod', async () => {
  const client = createClient({});
  const promise = client.startSession({});
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
});

test('ClientStartSession_CallConnectionStartUserSession_ProperConnectionExists', async () => {
  const mockStartUserSession = jest.fn(() => {});
  const client = createClient({ startUserSession: mockStartUserSession });
  await client.startSession({});
  expect(mockStartUserSession.mock.calls.length).toEqual(1);
});

test('ClientDeleteSession_ThrowError_ConnectionsHasNoClientsConnection', async () => {
  const client = createClient();
  const promise = client.deleteSession({});
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
});

test('ClientDeleteSession_ThrowError_ConnectionsHasNoDeleteUserSessionMethod', async () => {
  const client = createClient({});
  const promise = client.deleteSession({});
  await expect(promise).rejects.toThrowError('Inappropriate transport protocol.');
});

test('ClientDeleteSession_CallConnectionDeleteUserSession_ProperConnectionExists', async () => {
  const mockDeleteUserSession = jest.fn(() => {});
  const client = createClient({ deleteUserSession: mockDeleteUserSession });
  await client.deleteSession({});
  expect(mockDeleteUserSession.mock.calls.length).toEqual(1);
});

test('ConnectionInitialise_CallClientSetUser_SessionExists', async () => {
  const connection = createConnection({ username: 'username' }, {});
  await connection.initialise();
  expect(connection.client.setUser.mock.calls.length).toEqual(1);
});

test('ConnectionInitialise_NotCallClientSetUser_SessionNotExists', async () => {
  const connection = createConnection({}, {});
  await connection.initialise();
  expect(connection.client.setUser.mock.calls.length).toEqual(0);
});

test('ConnectionValidateStructure_ThrowError_InvalidJSON', async () => {
  const connection = createConnection({}, {});
  const invalidJSON = { some: 'json' };
  expect(() => connection.validateStructure(invalidJSON)).toThrowError('The JSON sent is not a valid Request object.');
});

test('ConnectionValidateStructure_ReturnUndefined_ValidJSON', async () => {
  const connection = createConnection({}, {});
  expect(connection.validateStructure(CORRECT_JSON)).toBeUndefined();
});

test('ConnectionParseJSON_ReturnObject_ValidJSON', async () => {
  const connection = createConnection({}, {});
  expect(connection.parseJSON(CORRECT_JSON_STRING)).toEqual(CORRECT_JSON);
});

test('ConnectionParseJSON_ThrowError_InvalidJSON', async () => {
  const connection = createConnection({}, {});
  expect(() => connection.parseJSON('{invalid: json')).toThrowError('Invalid JSON was received by the server.');
});

test('ConnectionError_NoDataAdded_ErrorHasNoDataProperty', async () => {
  const connection = createConnection({}, {});
  await connection.error(TEST_ERROR, 2);
  expect(connection.send.mock.calls[0][0]).toEqual({ jsonrpc: '2.0', id: 2, error: TEST_ERROR });
});

test('ConnectionError_IdNull_NoIdProvided', async () => {
  const connection = createConnection({}, {});
  await connection.error(TEST_ERROR);
  expect(connection.send.mock.calls[0][0]).toEqual({ jsonrpc: '2.0', id: null, error: TEST_ERROR });
});

test('ConnectionMessage_CallConnectionErrorWithThrowedError_OnErrorAndErrorPassIsTrue', async () => {
  const connection = createConnection({}, {});
  connection.parseJSON = jest.fn(() => {
    throw { TEST_ERROR, pass: true };
  });
  connection.error = jest.fn();
  await connection.message();
  expect(connection.error.mock.calls[0][0]).toEqual({ TEST_ERROR, pass: true });
});

test('ConnectionMessage_ThrowError_OnErrorAndErrorPassIsNotTrue', async () => {
  const connection = createConnection({}, {});
  connection.parseJSON = jest.fn(() => {
    throw new Error('test-message');
  });
  connection.error = jest.fn(() => {});
  const promise = connection.message();
  await expect(promise).rejects.toThrowError('test-message');
});

test('ConnectionCallProcedure_ThrowError_ConnectionModulesHasNoModuleWithModuleName', async () => {
  const connection = createConnection({}, {});
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).rejects.toThrowError('The method does not exist / is not available.');
});

test('ConnectionCallProcedure_ThrowError_NoInstanceFoundInModule', async () => {
  const connection = createConnection({}, { some: {} });
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).rejects.toThrowError('The method does not exist / is not available.');
});

test('ConnectionCallProcedure_ThrowError_InstanceHasNoMethod', async () => {
  const connection = createConnection({}, { some: { instance: {} } });
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).rejects.toThrowError('The method does not exist / is not available.');
});

test('ConnectionCallProcedure_ThrowError_ParamsForMethodIsNotValid', async () => {
  const modules = {
    some: {
      instance: { method: () => {} },
      validators: {
        method: {
          params: () => {
            return false;
          }
        }
      }
    }
  };
  const connection = createConnection({}, modules);
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).rejects.toThrowError('Invalid method parameter(s).');
});

test('ConnectionCallProcedure_ThrowError_MethodIsNotPublicCientHasNoUsername', async () => {
  const modules = {
    some: {
      instance: { method: () => {} },
      validators: {
        method: {
          params: () => {
            return true;
          }
        }
      },
      schema: { method: { public: false } }
    }
  };
  const connection = createConnection({}, modules);
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).rejects.toThrowError('Authentication credentials required.');
});

test('ConnectionCallProcedure_ThrowError_UserHasNoProperRole', async () => {
  const modules = {
    some: {
      instance: { method: () => {} },
      validators: {
        method: {
          params: () => {
            return true;
          }
        }
      },
      schema: { method: { public: true, roles: ['needRole'] } }
    }
  };
  const connection = createConnection({}, modules);
  connection.client.user = { username: 'username', role: 'role' };
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).rejects.toThrowError('Permission denied.');
});

test('ConnectionCallProcedure_ThrowError_InvalidResult', async () => {
  const modules = {
    some: {
      instance: { method: () => {} },
      validators: {
        method: {
          params: () => {
            return true;
          },
          result: () => {
            return false;
          }
        }
      },
      schema: { method: { public: true, roles: [] } }
    }
  };
  const connection = createConnection({}, modules);
  connection.client.user = { username: 'username', role: 'role' };
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).rejects.toThrowError(`Invalid response. From some/method. Recieve {}.`);
});

test('ConnectionCallProcedure_ReturnResult_MethodIsNotPublicCientHasUsername', async () => {
  const modules = {
    some: {
      instance: { method: () => {} },
      validators: {
        method: {
          params: () => {
            return true;
          },
          result: () => {
            return true;
          }
        }
      },
      schema: { method: { public: false, roles: [] } }
    }
  };
  const connection = createConnection({}, modules);
  connection.client.user = { username: 'username', role: 'role' };
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).resolves.toEqual({});
});

test('ConnectionCallProcedure_ReturnResult_UserHasProperRole', async () => {
  const modules = {
    some: {
      instance: { method: () => {} },
      validators: {
        method: {
          params: () => {
            return true;
          },
          result: () => {
            return true;
          }
        }
      },
      schema: { method: { public: true, roles: ['role'] } }
    }
  };
  const connection = createConnection({}, modules);
  connection.client.user = { username: 'username', role: 'role' };
  const promise = connection.callProcedure('some', 'method', {});
  await expect(promise).resolves.toEqual({});
});
