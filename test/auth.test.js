const { test, expect } = require('@jest/globals');
const { Auth } = require('../lib/auth');
const { SecurityUtil } = require('../lib/security-util');
const { UserService } = require('../lib/user');
const { SessionService } = require('../lib/session');

jest.mock('../lib/security-util');
jest.mock('../lib/user');
jest.mock('../lib/session');

beforeEach(() => {
  UserService.mockImplementation( () => {
    return {
      getByUsername: jest.fn( () => { return { role: 'user', createdTime: '2000-11-11', hashPassword: 'hashPassword' } } ),
      updatePassword: jest.fn( () => {} )
    };
  } );

  SessionService.mockImplementation( () => {
    return {
      restoreSession: jest.fn( () => { return 'testSessionUserName' } ),
      startSession: jest.fn( () => {} )
    };
  } );

  SecurityUtil.mockImplementation( () => {
    return {
      validatePassword: jest.fn( ( password ) => { return password === 'testPassword' } ),
      hashPassword: jest.fn( ( password ) => { return password } )
    };
  } );
})

test('AuthLogin_CallSecurityValidatePassword_UserHasNoSession', async () => {
  const auth = new Auth( new SessionService(), new UserService() );
  await auth.login( { username: 'username', password: 'testPassword' }, {}, {} );
  expect( auth.security.validatePassword.mock.calls.length ).toEqual(1);
});

test('AuthLogin_CallSessionServiceStartSession_CorrectPassword', async () => {
  const auth = new Auth( new SessionService(), new UserService() );
  await auth.login( { username: 'username', password: 'testPassword' }, {}, {} );
  expect( auth.sessionService.startSession.mock.calls.length ).toEqual(1);
});

test('AuthLogin_ThrowError_IncorrectPassword', async () => {
  const auth = new Auth( new SessionService(), new UserService() );
  return expect( auth.login( { username: 'username', password: 'incorrectPassword' }, {}, {} ) ).rejects.toThrowError('Authentication failed!');
});

test('AuthChangePassword_CallSecurityHashPassword_CorrectOldPassword', async () => {
  const auth = new Auth( new SessionService(), new UserService() );
  await auth.changePassword( { username: 'username', oldPassword: 'testPassword', newPassword: 'newPassword' } );
  expect( auth.security.hashPassword.mock.calls.length ).toEqual(1);
});

test('AuthChangePassword_CallSessionServiceUpdatePassword_CorrectOldPassword', async () => {
  const auth = new Auth( new SessionService(), new UserService() );
  await auth.changePassword( { username: 'username', oldPassword: 'testPassword', newPassword: 'newPassword' } );
  expect( auth.userService.updatePassword.mock.calls.length ).toEqual(1);
});

test('AuthChangePassword_ThrowError_IncorrectOldPassword', async () => {
  const auth = new Auth( new SessionService(), new UserService() );
  return expect( auth.changePassword( { username: 'username', oldPassword: 'incorrectPassword', newPassword: 'newPassword' } ) ).rejects.toThrowError('Password change failed!');
});
