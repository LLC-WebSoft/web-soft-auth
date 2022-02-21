const { test, expect } = require('@jest/globals');
const { SecurityUtil } = require('../lib/security-util');

test('SecurityUtilValidatePassword_ReturnTrue_PassingCorrectPasswordAndHash', async () => {
  const password = 'testpassword';
  const util = new SecurityUtil();
  const hashedPassword = await util.hashPassword(password);
  const result = await util.validatePassword(password, hashedPassword);
  expect(result).toBe(true);
});

test('SecurityUtilValidatePassword_ReturnFalse_PassingIncorrectPasswordAndHash', async () => {
  const password = 'testpassword';
  const util = new SecurityUtil();
  const hashedPassword = await util.hashPassword(password);
  const results = [
    await util.validatePassword('incorrectpassword', hashedPassword),
    await util.validatePassword('', hashedPassword),
    await util.validatePassword(password),
  ];
  expect(results).toEqual([false, false, false]);
});

test('SecurityUtilValidatePassword_ThrowError_InvalidPassword', async () => {
  const password = 'testpassword';
  const util = new SecurityUtil();
  const hashedPassword = await util.hashPassword(password);
  await expect( () => util.validatePassword(undefined, hashedPassword) ).rejects.toThrowError();
  await expect( () => util.validatePassword(null, hashedPassword) ).rejects.toThrowError();
  await expect( () => util.validatePassword(123, hashedPassword) ).rejects.toThrowError();
});

test('SecurityUtilValidatePassword_ThrowError_InvalidHash', async () => {
  const password = 'testpassword';
  const util = new SecurityUtil();
  expect( () => util.validatePassword(password, 'invalidHash') ).toThrowError('Node.js crypto module only supports scrypt');
  expect( () => util.validatePassword(password, '') ).toThrowError('Node.js crypto module only supports scrypt');
});
