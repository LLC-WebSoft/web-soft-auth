const { test, expect } = require('@jest/globals');
const { HTTPConnection } = require( '../lib/http-connection' );

test( 'HTTPConnection_HangListener_OnInitialisation', async () => {
  const response = { on: jest.fn(() => {}) };
  const connection = new HTTPConnection( {}, {}, response );
  expect(response.on.mock.calls[0][0]).toEqual('close');
  expect(typeof response.on.mock.calls[0][1]).toEqual('function');
} );

test( 'HTTPConnectionSetCors_ChangeCorsValue_ValueIsBoolean', async () => {
  const connection = new HTTPConnection( {}, {}, { on: () => {} } );
  connection.setCors(false);
  expect(connection.cors).toEqual(false);
} );

test( 'HTTPConnectionSetCors_NotChangeCorsValue_ValueIsNotBoolean', async () => {
  const connection = new HTTPConnection( {}, {}, { on: () => {} } );
  const falsy = [ null, undefined, '', 0, NaN ];
  for (const element of falsy) {
    connection.setCors(element);
    expect(connection.cors).toEqual(true);
  }
} );

test( 'HTTPConnectionGetHeaders_ChangeAccessControlAllowOriginHeader_CorsIsDisableAndOriginProvided', async () => {
  const request = { headers: { origin: 'test-origin' } };
  const connection = new HTTPConnection( request, {}, { on: () => {} } );
  connection.setCors(false);
  expect(connection.getHeaders()).toEqual(
    {
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': 'test-origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  );
} );

test( 'HTTPConnectionGetHeaders_NotChangeAccessControlAllowOriginHeader_CorsIsDisableAndOriginNotProvided', async () => {
  const request = { headers: { origin: '' } };
  const connection = new HTTPConnection( request, {}, { on: () => {} } );
  connection.setCors(false);
  expect(connection.getHeaders()).toEqual(
    {
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  );
} );

test( 'HTTPConnectionGetHeaders_NotChangeAccessControlAllowOriginHeader_CorsIsEnable', async () => {
  const request = { headers: { origin: '' } };
  const connection = new HTTPConnection( request, {}, { on: () => {} } );
  expect(connection.getHeaders()).toEqual(
    {
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  );
} );

test( 'HTTPConnectionGetHeaders_AddContentTypeHeader_ContentTypeProvided', async () => {
  const request = { headers: { origin: '' } };
  const connection = new HTTPConnection( request, {}, { on: () => {} } );
  expect(connection.getHeaders('type')).toEqual(
    {
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
      'Content-Type': 'type'
    }
  );
} );


test( 'HTTPConnectionGetHeaders_NotAddContentTypeHeader_ContentTypeIsNotProvided', async () => {
  const request = { headers: { origin: '' } };
  const connection = new HTTPConnection( request, {}, { on: () => {} } );
  expect(connection.getHeaders()).toEqual(
    {
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  );
} );

test( 'HTTPConnectionGetHeaders_NotAddContentTypeHeader_ContentTypeIsEmptyString', async () => {
  const request = { headers: { origin: '' } };
  const connection = new HTTPConnection( request, {}, { on: () => {} } );
  expect(connection.getHeaders('')).toEqual(
    {
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    }
  );
} );

test( 'HTTPConnectionWrite_NotCallResponseWriteHead_ResponseWritableEndedIsTrue', async () => {
  const request = { headers: { origin: '' } };
  const response = { writableEnded: true, on: () => {}, writeHead: jest.fn( () => {} ), end: jest.fn( () => {} ) };
  const connection = new HTTPConnection( request, {}, response );
  connection.write('data', 'json');
  expect( response.writeHead.mock.calls.length ).toEqual(0);
} );

test( 'HTTPConnectionWrite_CallHTTPConnectionGetHeaderWithProperMimyType_ResponseWritableEndedIsFalse', async () => {
  const request = { headers: { origin: '' } };
  const response = { writableEnded: false, on: () => {}, writeHead: jest.fn( () => {} ), end: jest.fn( () => {} ) };
  const connection = new HTTPConnection( request, {}, response );
  connection.getHeaders = jest.fn( () => {} );
  connection.write('data', 'json');
  expect( connection.getHeaders.mock.calls[0][0] ).toEqual('application/json');
} );

test( 'HTTPConnectionWrite_CallResponseWriteHead_ResponseWritableEndedIsFalse', async () => {
  const request = { headers: { origin: '' } };
  const response = { writableEnded: false, on: () => {}, writeHead: jest.fn( () => {} ), end: jest.fn( () => {} ) };
  const connection = new HTTPConnection( request, {}, response );
  connection.getHeaders = jest.fn( () => { return 'headers' } );
  connection.write('data', 'json');
  expect( response.writeHead.mock.calls[0][0] ).toEqual(200);
  expect( response.writeHead.mock.calls[0][1] ).toEqual('headers');
} );

test( 'HTTPConnectionWrite_CallResponseEnd_ResponseWritableEndedIsFalse', async () => {
  const request = { headers: { origin: '' } };
  const response = { writableEnded: false, on: () => {}, writeHead: jest.fn( () => {} ), end: jest.fn( () => {} ) };
  const connection = new HTTPConnection( request, {}, response );
  connection.write('data', 'json');
  expect( response.end.mock.calls[0][0] ).toEqual('data');
} );

test( 'HTTPConnectionOptions_NotCallResponseEnd_ResponseHeadersSentIsTrue', async () => {
  const request = { headers: { origin: '' } };
  const response = { headersSent: true, on: () => {}, writeHead: jest.fn( () => {} ), end: jest.fn( () => {} ) };
  const connection = new HTTPConnection( request, {}, response );
  connection.options();
  expect( response.end.mock.calls.length ).toEqual(0);
} );

test( 'HTTPConnectionOptions_CallResponseEnd_ResponseHeadersSentIsFalse', async () => {
  const request = { headers: { origin: '' } };
  const response = { headersSent: false, on: () => {}, writeHead: jest.fn( () => {} ), end: jest.fn( () => {} ) };
  const connection = new HTTPConnection( request, {}, response );
  connection.options();
  expect( response.end.mock.calls.length ).toEqual(1);
} );

test( 'HTTPConnectionOptions_CallResponseWriteHead_ResponseHeadersSentIsFalse', async () => {
  const request = { headers: { origin: '' } };
  const response = { headersSent: false, on: () => {}, writeHead: jest.fn( () => {} ), end: jest.fn( () => {} ) };
  const connection = new HTTPConnection( request, {}, response );
  connection.getHeaders = jest.fn( () => { return 'headers' } );
  connection.options();
  expect( response.writeHead.mock.calls[0][0] ).toEqual(200);
  expect( response.writeHead.mock.calls[0][1] ).toEqual('headers');
} );
