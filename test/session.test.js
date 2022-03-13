const { test, expect } = require('@jest/globals');
const { sessionService } = require('../lib/session');

jest.mock( '../lib/db', () => {
  return {
    database: {
      insert: () => {},
      delete: () => {},
      select: () => {}
    }
  }
} );

jest.mock( 'crypto', () => {
  return {
    randomUUID: () => 'randomuuid'
  }
} );

test( 'SessionServiceGetTokenFromRequest_ReturnEmptyString_NoCookieHeaderPassed', () => {
  expect(sessionService.getTokenFromRequest( { headers: {} } )).toEqual('');
} );

test( 'SessionServiceGetTokenFromRequest_ReturnEmptyString_NoTokenCookieFind', () => {
  jest.mock( '../lib/utils', () => {
    return {
      parseCookies: jest.fn( () => { return {} } )
    }
  } );
  expect(sessionService.getTokenFromRequest( { headers: { cookie: '' } } )).toEqual('');
} );

test( 'SessionServiceGetTokenFromRequest_ReturnToken_CorrectCookiePassed', () => {
  expect(sessionService.getTokenFromRequest( { headers: { cookie: 'token=testtoken' } } )).toEqual('testtoken');
} );

test( 'SessionServiceStartSession_SetCorrectCookie_ResponsePassed', async () => {
  const response = { setHeader: jest.fn( () => {} ) };
  await sessionService.startSession( { headers: { host: 'www.example.com' } }, response, 'testusername' );
  expect(response.setHeader.mock.calls[0][0]).toEqual('Set-Cookie');
  expect(response.setHeader.mock.calls[0][1]).toEqual(`token=randomuuid; Expires=Fri, 01 Jan 2100 00:00:00 GMT; Path=/; Domain=www.example.com; SameSite=None; Secure; HttpOnly`);
} );

test( 'SessionServiceEndSession_SetCorrectCookie_ResponsePassed', async () => {
  const response = { setHeader: jest.fn( () => {} ) };
  await sessionService.endSession( { headers: { host: 'www.example.com' } }, response, 'testusername' );
  expect(response.setHeader.mock.calls[0][0]).toEqual('Set-Cookie');
  expect(response.setHeader.mock.calls[0][1]).toEqual(`token=deleted; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=www.example.com; SameSite=None; Secure; HttpOnly`);
} );
