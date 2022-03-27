const { test, expect } = require('@jest/globals');
const { parseHost, parseCookies } = require('../../lib/utils');

test('ParseHost_ThrowsError_HostIsFalsy', () => {
  expect(() => parseHost('')).toThrowError('No host name in HTTP headers!');
});

test('ParseHost_ReturnCorrectHost_HostIncludePort', () => {
  const host = 'www.example.com:8080';
  expect(parseHost(host)).toEqual('www.example.com');
});

test('ParseHost_ReturnCorrectHost_HostNotIncludePort', () => {
  const host = 'www.example.com';
  expect(parseHost(host)).toEqual('www.example.com');
});

test('ParseCookies_ReturnCorrectCookieObject_CorrectCookieString', () => {
  const cookie = 'cookie1 = 1; cookie2 = 2; cookie3 = 3; Expires=Wed, 21 Oct 2015 07:28:00 GMT; Secure; HttpOnly';
  const result = {
    cookie1: '1',
    cookie2: '2',
    cookie3: '3',
    Expires: 'Wed, 21 Oct 2015 07:28:00 GMT',
    Secure: '',
    HttpOnly: ''
  };
  expect(parseCookies(cookie)).toEqual(result);
});

test('ParseCookies_ReturnCorrectCookieObject_CookieStringWithExtraSpaces', () => {
  const cookie =
    'cookie1 =    1    ;     cookie2   = 2; cookie3    =     3; Expires=   Wed, 21 Oct 2015 07:28:00 GMT; Secure   ; HttpOnly';
  const result = {
    cookie1: '1',
    cookie2: '2',
    cookie3: '3',
    Expires: 'Wed, 21 Oct 2015 07:28:00 GMT',
    Secure: '',
    HttpOnly: ''
  };
  expect(parseCookies(cookie)).toEqual(result);
});
