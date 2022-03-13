const { test, expect } = require('@jest/globals');
const { Auth } = require('../lib/auth');
const { security } = require('../lib/security-util');
const { userService } = require('../lib/user');

beforeEach( () => {
  userService.getByUsername = jest.fn( ( username ) => { return { username, password: 'testPassword' } } );
  security.validatePassword = jest.fn( ( password ) => { return password === 'testPassword' } );
  userService.updatePassword = jest.fn( () => {} );
} );

test('AuthLogin_CallUserServiceGetByUsername_UserHasNoSession', async () => {
  const auth = new Auth();
  const startSession = jest.fn( () => {} );
  await auth.login( { username: 'username', password: 'testPassword' }, { session: {}, user: {}, startSession } );
  expect( userService.getByUsername.mock.calls.length ).toEqual(1);
});

test('AuthLogin_NotCallUserServiceGetByUsername_UserHasSession', async () => {
  const auth = new Auth();
  const startSession = jest.fn( () => {} );
  await auth.login( { username: 'username', password: 'testPassword' }, { session: { username: 'username' }, user: {}, startSession } );
  expect( userService.getByUsername.mock.calls.length ).toEqual(0);
});

test('AuthLogin_CallStartSession_ValidPassword', async () => {
  const auth = new Auth();
  const startSession = jest.fn( () => {} );
  await auth.login( { username: 'username', password: 'testPassword' }, { session: {}, user: {}, startSession } );
  expect( startSession.mock.calls.length ).toEqual(1);
});

test('AuthLogin_ThrowError_InvalidPassword', async () => {
  const auth = new Auth();
  const startSession = jest.fn( () => {} );
  const promise = auth.login( { username: 'username', password: 'invalidPassword' }, { session: {}, user: {}, startSession } );
  await expect( promise ).rejects.toThrowError( 'Authentication failed.' );
});

test('AuthChangePassword_ThrowError_InvalidPassword', async () => {
  const auth = new Auth();
  const startSession = jest.fn( () => {} );
  const promise = auth.changePassword(
    {
      username: 'username',
      oldPassword: 'invalidPassword',
      newPassword: 'newPassword'
    },
    {
      session: {},
      user: {},
      startSession
    } );
  await expect( promise ).rejects.toThrowError( 'Authentication failed.' );
});

test('AuthChangePassword_CallUserServiceUpdatePassword_ValidPassword', async () => {
  const auth = new Auth();
  const startSession = jest.fn( () => {} );
  await auth.changePassword(
    {
      username: 'username',
      oldPassword: 'testPassword',
      newPassword: 'newPassword'
    },
    {
      session: {},
      user: {},
      startSession
    } );
  expect( userService.updatePassword.mock.calls.length ).toEqual(1);
});
