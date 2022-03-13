const { test, expect } = require('@jest/globals');
const { security } = require('../lib/security-util');

test('SecurityUtilValidatePassword_ReturnTrue_PassingCorrectPasswordAndHash', async () => {
  const password = 'testpassword';
  const hashedPassword = await security.hashPassword(password);
  const result = await security.validatePassword(password, hashedPassword);
  expect(result).toBe(true);
});

test('SecurityUtilValidatePassword_ReturnFalse_PassingIncorrectPasswordAndHash', async () => {
  const password = 'testpassword';
  const hashedPassword = await security.hashPassword(password);
  const results = [
    await security.validatePassword('incorrectpassword', hashedPassword),
    await security.validatePassword('', hashedPassword),
    await security.validatePassword(password),
  ];
  expect(results).toEqual([false, false, false]);
});

test('SecurityUtilValidatePassword_ThrowError_InvalidPassword', async () => {
  const password = 'testpassword';
  const hashedPassword = await security.hashPassword(password);
  await expect( () => security.validatePassword(undefined, hashedPassword) ).rejects.toThrowError();
  await expect( () => security.validatePassword(null, hashedPassword) ).rejects.toThrowError();
  await expect( () => security.validatePassword(123, hashedPassword) ).rejects.toThrowError();
});

test('SecurityUtilValidatePassword_ThrowError_InvalidHash', async () => {
  const password = 'testpassword';
  expect( () => security.validatePassword(password, 'invalidHash') ).toThrowError('Node.js crypto module only supports scrypt');
  expect( () => security.validatePassword(password, '') ).toThrowError('Node.js crypto module only supports scrypt');
});
