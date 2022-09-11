const { test, expect } = require('@jest/globals');
const { security } = require('../../../lib/security-util');

test('SecurityUtilValidatePassword_ReturnTrue_PassingCorrectPasswordAndHash', async () => {
  const password = 'testpassword';
  const hashedPassword = await security.hashPassword(password);
  const result = await security.validatePassword(password, hashedPassword);
  expect(result).toBe(true);
});

test('SecurityUtilValidatePassword_ReturnFalse_PassingIncorrectPassword', async () => {
  const password = 'testpassword';
  const hashedPassword = await security.hashPassword(password);
  const result = await security.validatePassword('incorrectpassword', hashedPassword);
  expect(result).toEqual(false);
});

test('SecurityUtilValidatePassword_ReturnFalse_PassingIncorrectHash', async () => {
  const password = 'testpassword';
  const result = await security.validatePassword(password);
  expect(result).toEqual(false);
});

test('SecurityUtilValidatePassword_ThrowError_InvalidPassword', async () => {
  const password = 'testpassword';
  const hashedPassword = await security.hashPassword(password);
  await expect(() => security.validatePassword(123, hashedPassword)).rejects.toThrowError();
});

test('SecurityUtilValidatePassword_ThrowError_InvalidHash', async () => {
  const password = 'testpassword';
  expect(() => security.validatePassword(password, 'invalidHash')).toThrowError(
    'Node.js crypto module only supports scrypt'
  );
});
