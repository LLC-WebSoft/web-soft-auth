const { test, expect } = require('@jest/globals');
const { registerError, ERRORS } = require('../../../lib/error');

test('RegisterError_ThrowError_LabelIsNotProvided', async () => {
  expect(() => {
    registerError();
  }).toThrowError(/label(.*)provided/gi);
});

test('RegisterError_ThrowError_CodeIsNotProvided', async () => {
  expect(() => {
    registerError('TEST_LABEL');
  }).toThrowError(/code(.*)provided/gi);
});

test('RegisterError_AddErrorToERRORSObject_LabelAndCodeProvided', async () => {
  registerError('TEST_LABEL', 9999, 'Test message');
  expect(ERRORS['TEST_LABEL']).toEqual({ code: 9999, message: 'Test message' });
});
