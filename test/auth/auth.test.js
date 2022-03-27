const { test, expect } = require('@jest/globals');
const { createAuth, getContext, userService } = require('./prepare');

test('AuthLogin_CallUserServiceGetByUsername_UserHasNoSession', async () => {
  const auth = createAuth();
  await auth.login({ username: 'username', password: 'testPassword' }, getContext());
  expect(userService.getByUsername.mock.calls.length).toEqual(1);
});

test('AuthLogin_NotCallUserServiceGetByUsername_UserHasSession', async () => {
  const auth = createAuth();
  await auth.login({ username: 'username', password: 'testPassword' }, getContext({ username: 'username' }));
  expect(userService.getByUsername.mock.calls.length).toEqual(0);
});

test('AuthLogin_CallStartSession_ValidPassword', async () => {
  const auth = createAuth();
  const context = getContext();
  await auth.login({ username: 'username', password: 'testPassword' }, context);
  expect(context.startSession.mock.calls.length).toEqual(1);
});

test('AuthLogin_ThrowError_InvalidPassword', async () => {
  const auth = createAuth();
  const promise = auth.login({ username: 'username', password: 'invalidPassword' }, getContext());
  await expect(promise).rejects.toThrowError('Authentication failed.');
});

test('AuthChangePassword_ThrowError_InvalidPassword', async () => {
  const auth = createAuth();
  const promise = auth.changePassword(
    {
      username: 'username',
      oldPassword: 'invalidPassword',
      newPassword: 'newPassword'
    },
    getContext()
  );
  await expect(promise).rejects.toThrowError('Authentication failed.');
});

test('AuthChangePassword_CallUserServiceUpdatePassword_ValidPassword', async () => {
  const auth = createAuth();
  await auth.changePassword(
    {
      username: 'username',
      oldPassword: 'testPassword',
      newPassword: 'newPassword'
    },
    getContext()
  );
  expect(userService.updatePassword.mock.calls.length).toEqual(1);
});
