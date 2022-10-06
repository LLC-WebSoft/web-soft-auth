const { test, expect, afterAll } = require('@jest/globals');
const { call, closeDatabaseConnection } = require('./helper');

test('ServerHTTPRequest_ReturnError_MaxPayloadSizeExeeded', async () => {
  const payload = new Array(1024 * 1024 * 10).join('s');
  await expect(call('example/method', { param1: 1, param2: payload })).resolves.toEqual(
    expect.objectContaining({
      code: expect.any(Number),
      message: expect.stringMatching(/exceeded/i)
    })
  );
});

test('ServerHTTPRequest_ReturnError_MethodNotFound', async () => {
  await expect(call('example/incorrect', {})).resolves.toEqual(
    expect.objectContaining({
      code: expect.any(Number),
      message: expect.stringMatching(/exist/i)
    })
  );
});

afterAll(async () => {
  await closeDatabaseConnection();
});
