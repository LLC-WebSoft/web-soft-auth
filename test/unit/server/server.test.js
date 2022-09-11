const { test, expect } = require('@jest/globals');
const { createFakeConnection, createServer, getIntrospectionModule, logger } = require('./prepare');

test('Server_RewriteDefaultConfig_ConfigPassed', async () => {
  const server = createServer({ port: 4000 });
  expect(server.config.port).toEqual(4000);
});

test('ServerStart_CallModuleFactoryCreateWithModulesPassed_MethodCalled', async () => {
  const server = createServer();
  server.start({ test: 'test' });
  expect(server.modulesFactory.create.mock.calls[0][0]).toEqual({ test: 'test' });
});

test('ServerStart_CallGetIntrospectionModuleWithModulesPassed_MethodCalled', async () => {
  const server = createServer();
  server.start({ test: 'test' });
  expect(getIntrospectionModule.mock.calls[0][0]).toEqual({ test: 'test' });
});

test('ServerStart_LogInformation_HTTPServerEmitsListening', async () => {
  const server = createServer();
  logger.info.mockClear();
  server.start({ test: 'test' });
  server.server.emit('listening');
  expect(logger.info.mock.calls.length).toEqual(2);
});

test('ServerStart_CallHttpFactoryCreate_OnHttpRequest', async () => {
  const connection = createFakeConnection();
  const server = createServer({}, connection);
  server.start();
  await server.server.emitRequest();
  expect(server.httpFactory.create.mock.calls.length).toEqual(1);
});

test('ServerStart_CallConnectionSetCors_ServerCorsIsFalse', async () => {
  const connection = createFakeConnection();
  const server = createServer({ cors: false }, connection);
  server.start();
  await server.server.emitRequest();
  expect(connection.setCors.mock.calls.length).toEqual(1);
  expect(connection.setCors.mock.calls[0][0]).toEqual(false);
});

test('ServerStart_CallConnectionOptions_RequestMethodIsOPTIONS', async () => {
  const connection = createFakeConnection('OPTIONS');
  const server = createServer({}, connection);
  server.start();
  await server.server.emitRequest();
  expect(connection.options.mock.calls.length).toEqual(1);
});

test('ServerStart_CallConnectionMessage_RequestMethodIsPOST', async () => {
  const connection = createFakeConnection();
  const server = createServer({}, connection);
  server.start();
  await server.server.emitRequest();
  expect(connection.message.mock.calls.length).toEqual(1);
});

test('ServerStart_CallConnectionInitialise_RequestMethodIsPOST', async () => {
  const connection = createFakeConnection();
  const server = createServer({}, connection);
  server.start();
  await server.server.emitRequest();
  expect(connection.initialise.mock.calls.length).toEqual(1);
});

test('ServerStart_CallConnectionError_InvalidHttpMethod', async () => {
  const connection = createFakeConnection('GET');
  const server = createServer({}, connection);
  server.start();
  await server.server.emitRequest();
  expect(connection.error.mock.calls.length).toEqual(1);
  expect(connection.error.mock.calls[0][0]).toBeInstanceOf(Error);
});

test('ServerStart_ThrowError_ErrorPassIsNotTrue', async () => {
  const connection = createFakeConnection();
  connection.message = () => {
    throw new Error('test-error');
  };
  const server = createServer({}, connection);
  server.start();
  const promise = server.server.emitRequest();
  await expect(promise).rejects.toThrowError('test-error');
});

test('ServerStart_CallWSFactoryCreate_OnWSConnection', async () => {
  const connection = createFakeConnection();
  const server = createServer({}, connection);
  server.start();
  await server.ws.emit('connection', connection);
  expect(server.wsFactory.create.mock.calls.length).toEqual(1);
});

test('ServerStart_CallConnectionInitialise_OnWSConnection', async () => {
  const connection = createFakeConnection();
  const server = createServer({}, connection);
  server.start();
  await server.ws.emit('connection', connection);
  expect(connection.initialise.mock.calls.length).toEqual(1);
});

test('ServerClose_LoggerError_NodeServerSendError', async () => {
  const server = createServer({});
  server.server.close = (callback) => {
    callback(new Error());
  };
  logger.error.mockClear();
  await server.close();
  expect(logger.error.mock.calls.length).toEqual(1);
  expect(logger.error.mock.calls[0][0]).toBeInstanceOf(Error);
});

test('ServerClose_CallConnectionTerminate_ConnectionsHasWSConnection', async () => {
  const server = createServer({});
  const connection = createFakeConnection();
  connection.connection = { terminate: jest.fn() };
  await server.close();
  expect(connection.connection.terminate.mock.calls.length).toEqual(1);
});

test('ServerClose_CallConnectionError_ConnectionsHasHTTPConnection', async () => {
  const server = createServer({});
  const connection = createFakeConnection();
  await server.close();
  expect(connection.error.mock.calls.length).toEqual(1);
});

test('ServerClose_CallNodeConnectionDestroy_ConnectionsHasHTTPConnection', async () => {
  const server = createServer({});
  const connection = createFakeConnection();
  await server.close();
  expect(connection.request.connection.destroy.mock.calls.length).toEqual(1);
});
