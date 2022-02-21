const { test, expect } = require('@jest/globals');
const { randomUUID } = require('crypto');
const { Session, SessionService, SessionRepository } = require('../lib/session');

jest.mock( 'crypto', () => {
  return {
    randomUUID: jest.fn( () => { return 'randomuuid' } )
  }
} );

test( 'SessionConstructor_CallRandomUUID_NoTokenPassed', () => {
  new Session();
  expect(randomUUID.mock.calls.length).toBe(1);
} );

test( 'SessionServiceGetTokenFromRequest_ReturnEmptyString_NoCookieHeaderPassed', () => {
  const sessionService = new SessionService();
  expect(sessionService.getTokenFromRequest( { headers: {} } )).toEqual('');
} );

test( 'SessionServiceGetTokenFromRequest_ReturnEmptyString_NoTokenCookieFind', () => {
  jest.mock( '../lib/utils', () => {
    return {
      parseCookies: jest.fn( () => { return {} } )
    }
  } );
  const sessionService = new SessionService();
  expect(sessionService.getTokenFromRequest( { headers: { cookie: '' } } )).toEqual('');
} );

test( 'SessionServiceGetTokenFromRequest_ReturnToken_CorrectCookiePassed', () => {
  const sessionService = new SessionService();
  expect(sessionService.getTokenFromRequest( { headers: { cookie: 'token=testtoken' } } )).toEqual('testtoken');
} );

test( 'SessionServiceStartSession_SetCorrectCookie_ResponsePassed', async () => {
  const response = { setHeader: jest.fn( () => {} ) };
  const sessionService = new SessionService( { insert: jest.fn( async () => { return {} } ) } );
  await sessionService.startSession( { headers: { host: 'www.example.com' } }, response, 'testusername' );
  expect(response.setHeader.mock.calls[0][0]).toEqual('Set-Cookie');
  expect(response.setHeader.mock.calls[0][1]).toEqual(`token=randomuuid; Expires=Fri, 01 Jan 2100 00:00:00 GMT; Path=/; Domain=www.example.com; SameSite=None; Secure; HttpOnly`);
} );

test( 'SessionServiceEndSession_SetCorrectCookie_ResponsePassed', async () => {
  const response = { setHeader: jest.fn( () => {} ) };
  const sessionService = new SessionService( { delete: jest.fn( async () => { return {} } ) } );
  await sessionService.endSession( { headers: { host: 'www.example.com' } }, response, 'testusername' );
  expect(response.setHeader.mock.calls[0][0]).toEqual('Set-Cookie');
  expect(response.setHeader.mock.calls[0][1]).toEqual(`token=deleted; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=www.example.com; SameSite=None; Secure; HttpOnly`);
} );
