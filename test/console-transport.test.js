const { consoleTransport } = require('../lib/console-transport');
const { test, expect } = require('@jest/globals');

test( 'ConsoleTransportLog_LogStack_StackProvided', async () => {
  console.log = jest.fn( () => {} );
  consoleTransport.log( { stack: 'stack', message: 'message' } );
  expect(console.log.mock.calls[0][1]).toEqual('stack');
} );

test( 'ConsoleTransportLog_LogMessage_StackNotProvided', async () => {
  console.log = jest.fn( () => {} );
  consoleTransport.log( { message: 'message' } );
  expect(console.log.mock.calls[0][1]).toEqual('message');
} );
