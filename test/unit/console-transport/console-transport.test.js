const { test, expect } = require('@jest/globals');
const { createTransport } = require('./prepare');

test('ConsoleTransportLog_LogStack_StackProvided', async () => {
  const transport = createTransport();
  transport.log({ stack: 'stack', message: 'message' });
  expect(console.log.mock.calls[0][1]).toEqual('stack');
});

test('ConsoleTransportLog_LogMessage_StackNotProvided', async () => {
  const transport = createTransport();
  transport.log({ message: 'message' });
  expect(console.log.mock.calls[0][1]).toEqual('message');
});
