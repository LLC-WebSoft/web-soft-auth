const { test, expect, afterAll } = require('@jest/globals');
const { getCaller, closeDatabaseConnection } = require('./helper');

const testOrigin = 'http://test-origin';

test('ServerWSRequest_SuccessfulComplete', async () => {
  const call = await getCaller('ws', testOrigin);
  await expect(call('example/method', { param1: 1, param2: 'string' })).resolves.toEqual({
    message: 'Hello from server!'
  });
});

test('ServerHTTPRequest_SuccessfulComplete', async () => {
  const call = await getCaller('http', testOrigin);
  await expect(call('example/method', { param1: 1, param2: 'string' })).resolves.toEqual({
    message: 'Hello from server!'
  });
});

test('ServerHTTPRequest_ReturnError_MaxPayloadSizeExeeded', async () => {
  const call = await getCaller('http', testOrigin);
  const payload = new Array(1024 * 1024 * 10).join('s');
  await expect(call('example/method', { param1: 1, param2: payload })).resolves.toEqual(
    expect.objectContaining({
      code: expect.any(Number),
      message: expect.stringMatching(/exceeded/i)
    })
  );
});

test('ServerWSRequest_ReturnEmpty_MaxPayloadSizeExeeded', async () => {
  const call = await getCaller('ws', testOrigin);
  const payload = new Array(1024 * 1024 * 10).join('s');
  await expect(call('example/method', { param1: 1, param2: payload })).resolves.toEqual({});
});

test('ServerHTTPRequest_ReturnError_MethodNotFound', async () => {
  const call = await getCaller('ws', testOrigin);
  await expect(call('example/incorrect', {})).resolves.toEqual(
    expect.objectContaining({
      code: expect.any(Number),
      message: expect.stringMatching(/exist/i)
    })
  );
});

test('ServerWSRequest_ReturnError_MethodNotFound', async () => {
  const call = await getCaller('ws', testOrigin);
  await expect(call('example/incorrect', {})).resolves.toEqual(
    expect.objectContaining({
      code: expect.any(Number),
      message: expect.stringMatching(/exist/i)
    })
  );
});

test('ServerWSRequest_ConnectionAborted_IncorrectOrigin', async () => {
  await expect(getCaller('ws', 'incorrect')).rejects.toThrowError(/403/i);
});

afterAll(async () => {
  await closeDatabaseConnection();
});
