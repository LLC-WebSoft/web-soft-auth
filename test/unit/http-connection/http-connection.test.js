const { test, expect } = require('@jest/globals');
const { createConnection, HEADERS, createFakeRequest, createFakeResponse } = require('./prepare');

test('HTTPConnection_HangListener_OnInitialisation', async () => {
  const connection = createConnection();
  expect(connection.response.on.mock.calls[0][0]).toEqual('close');
  expect(typeof connection.response.on.mock.calls[0][1]).toEqual('function');
});

test('HTTPConnectionSetCors_ChangeCorsValue_ValueIsBoolean', async () => {
  const connection = createConnection();
  connection.setCors(false);
  expect(connection.cors).toEqual(false);
});

test('HTTPConnectionSetCors_NotChangeCorsValue_ValueIsNotBoolean', async () => {
  const connection = createConnection();
  connection.setCors(null);
  expect(connection.cors).toEqual(true);
});

test('HTTPConnectionGetHeaders_ChangeAccessControlAllowOriginHeader_CorsIsDisableAndOriginProvided', async () => {
  const request = createFakeRequest('test-origin');
  const connection = createConnection(request);
  connection.setCors(false);
  expect(connection.getHeaders()).toEqual({
    ...HEADERS,
    'Access-Control-Allow-Origin': 'test-origin'
  });
});

test('HTTPConnectionGetHeaders_NotChangeAccessControlAllowOriginHeader_CorsIsDisableAndOriginNotProvided', async () => {
  const connection = createConnection();
  connection.setCors(false);
  expect(connection.getHeaders()).toEqual(HEADERS);
});

test('HTTPConnectionGetHeaders_NotChangeAccessControlAllowOriginHeader_CorsIsEnable', async () => {
  const connection = createConnection();
  expect(connection.getHeaders()).toEqual(HEADERS);
});

test('HTTPConnectionGetHeaders_AddContentTypeHeader_ContentTypeProvided', async () => {
  const connection = createConnection();
  expect(connection.getHeaders('type')).toEqual({
    ...HEADERS,
    'Content-Type': 'type'
  });
});

test('HTTPConnectionGetHeaders_NotAddContentTypeHeader_ContentTypeIsNotProvided', async () => {
  const connection = createConnection();
  expect(connection.getHeaders()).toEqual(HEADERS);
});

test('HTTPConnectionGetHeaders_NotAddContentTypeHeader_ContentTypeIsEmptyString', async () => {
  const connection = createConnection();
  expect(connection.getHeaders('')).toEqual(HEADERS);
});

test('HTTPConnectionWrite_NotCallResponseWriteHead_ResponseWritableEndedIsTrue', async () => {
  const response = createFakeResponse({ writableEnded: true });
  const connection = createConnection({}, {}, response);
  connection.write('data', 'json');
  expect(response.writeHead.mock.calls.length).toEqual(0);
});

test('HTTPConnectionWrite_CallHTTPConnectionGetHeaderWithProperMimyType_ResponseWritableEndedIsFalse', async () => {
  const connection = createConnection();
  connection.getHeaders = jest.fn();
  connection.write('data', 'json');
  expect(connection.getHeaders.mock.calls[0][0]).toEqual('application/json');
});

test('HTTPConnectionWrite_CallResponseWriteHead_ResponseWritableEndedIsFalse', async () => {
  const connection = createConnection();
  connection.getHeaders = jest.fn(() => {
    return 'headers';
  });
  connection.write('data', 'json');
  expect(connection.response.writeHead.mock.calls[0][0]).toEqual(200);
  expect(connection.response.writeHead.mock.calls[0][1]).toEqual('headers');
});

test('HTTPConnectionWrite_CallResponseEnd_ResponseWritableEndedIsFalse', async () => {
  const connection = createConnection();
  connection.write('data', 'json');
  expect(connection.response.end.mock.calls[0][0]).toEqual('data');
});

test('HTTPConnectionOptions_NotCallResponseEnd_ResponseHeadersSentIsTrue', async () => {
  const response = createFakeResponse({ headersSent: true });
  const connection = createConnection({}, {}, response);
  connection.options();
  expect(response.end.mock.calls.length).toEqual(0);
});

test('HTTPConnectionOptions_CallResponseEnd_ResponseHeadersSentIsFalse', async () => {
  const connection = createConnection();
  connection.options();
  expect(connection.response.end.mock.calls.length).toEqual(1);
});

test('HTTPConnectionOptions_CallResponseWriteHead_ResponseHeadersSentIsFalse', async () => {
  const connection = createConnection();
  connection.getHeaders = jest.fn(() => {
    return 'headers';
  });
  connection.options();
  expect(connection.response.writeHead.mock.calls[0][0]).toEqual(200);
  expect(connection.response.writeHead.mock.calls[0][1]).toEqual('headers');
});
