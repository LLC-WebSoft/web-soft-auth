const { test, expect, describe, beforeEach, afterAll } = require('@jest/globals');
const { call, clearTables, closeDatabaseConnection, addTestData, clearCookies, setCookie, auth } = require('./helpers');

const testUserData = {
  username: 'test_user',
  password:
    '$scrypt$N=32768,r=8,p=1,maxmem=67108864$WDvlWv547xK6YjokhmlArebEs92/Ug+a8GtU2b+ER84$11RTxyQMbuyft3XJ7nethkvNALfSREfemmr0phYAvam8MC4qp0lSAe91DDmZC2FufT0RKTo18p8do+jj+M8oMw',
  role: 'user'
};

describe('Tests for auth module.', () => {
  beforeEach(async () => {
    await clearTables('SystemUser', 'Session');
  });

  test('AuthLogin_SuccessfulRequest', async () => {
    await addTestData('SystemUser', testUserData);
    await expect(call('auth/login', { username: 'test_user', password: 'test_password' })).resolves.toEqual(
      expect.objectContaining({
        username: 'test_user',
        role: 'user',
        createdTime: expect.any(String)
      })
    );
  });

  test('AuthLogin_InvalidParams_Password', async () => {
    await addTestData('SystemUser', testUserData);
    await expect(call('auth/login', { username: 'test_user', password: 'incorrect_password' })).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Authentication')
      })
    );
  });

  test('AuthLogin_NotFound_User', async () => {
    await expect(call('auth/login', { username: 'test_user', password: 'test_password' })).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Authentication')
      })
    );
  });

  test('AuthRegister_SuccessfulRequest', async () => {
    await expect(call('auth/register', { username: 'test_user', password: 'test_password' })).resolves.toEqual(
      expect.objectContaining({
        username: 'test_user',
        role: 'user',
        createdTime: expect.any(String)
      })
    );
  });

  test('AuthRegister_InvalidParams_EmptyUsername', async () => {
    await expect(call('auth/register', { username: '', password: 'test_password' })).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Invalid')
      })
    );
  });

  test('AuthRegister_InvalidParams_EmptyPassword', async () => {
    await expect(call('auth/register', { username: 'test_user', password: '' })).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Invalid')
      })
    );
  });

  test('AuthRegister_DatabaseConflict_SameUsername', async () => {
    await addTestData('SystemUser', testUserData);
    await expect(call('auth/register', { username: 'test_user', password: 'test_password' })).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Conflict')
      })
    );
  });

  test('AuthLogout_SuccessfulRequest', async () => {
    await auth('user');
    await expect(call('auth/logout', {})).resolves.toEqual({});
  });

  test('AuthLogout_InvalidParams_NotAuth', async () => {
    clearCookies();
    await expect(call('auth/logout', {})).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Authentication')
      })
    );
  });

  test('AuthMe_SuccessfulRequest', async () => {
    const user = await auth('user');
    await expect(call('auth/me', {})).resolves.toEqual(
      expect.objectContaining({
        username: user.username,
        role: 'user',
        createdTime: expect.any(String)
      })
    );
  });

  test('AuthMe_InvalidParams_NotAuth', async () => {
    await expect(call('auth/me', {})).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Authentication')
      })
    );
  });

  test('AuthChangePassword_SuccessfulRequest', async () => {
    const user = await auth('user');
    await expect(
      call('auth/changePassword', { oldPassword: user.password, newPassword: 'new_password' })
    ).resolves.toEqual(
      expect.objectContaining({
        username: user.username,
        role: 'user',
        createdTime: expect.any(String)
      })
    );
  });

  test('AuthChangePassword_InvalidParams_OldPassword', async () => {
    await auth('user');
    await expect(
      call('auth/changePassword', {
        oldPassword: 'invalid_password',
        newPassword: 'new_password'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Authentication')
      })
    );
  });

  test('AuthChangePassword_InvalidParams_NewPassword', async () => {
    const user = await auth('user');
    await expect(
      call('auth/changePassword', {
        oldPassword: user.password,
        newPassword: ''
      })
    ).resolves.toEqual(
      expect.objectContaining({
        code: expect.any(Number),
        message: expect.stringContaining('Invalid')
      })
    );
  });

  afterAll(async () => {
    await clearTables('SystemUser', 'Session');
    await closeDatabaseConnection();
  });
});
