const { test, expect } = require('@jest/globals');
const { logger, createFakeTransport, DEFAULT_SETTINGS } = require('./prepare');

test('LoggerSetSettings_OverrideSettings_SettingsObjectPass', async () => {
  logger.setSettings({ sql: false });
  expect(logger.settings).toEqual({
    ...DEFAULT_SETTINGS,
    sql: false
  });
});

test('LoggerSetTransport_ThrowError_TransportHasNoLogMethod', async () => {
  expect(() => {
    logger.setTransport({});
  }).toThrowError('Transport for Logger must have log method.');
});

test('LoggerSetTransport_ChangeTransport_TransportHasLogMethod', async () => {
  const transport = createFakeTransport();
  logger.setTransport(transport);
  expect(logger.transport).toEqual(transport);
});

test('LoggerLogMessage_NotCallTransportLog_LogTypeIsFalse', async () => {
  logger.setSettings({ info: false });
  logger.logMessage('info', 'test', '');
  expect(logger.transport.log.mock.calls.length).toEqual(0);
});

test('LoggerLogMessage_CallTransportLogWithStack_LogTypeIsTrueStackProvided', async () => {
  logger.logMessage('info', 'test', 'test-stack');
  expect(logger.transport.log.mock.calls[0][0]).toEqual({ type: 'info', message: 'test', stack: 'test-stack' });
});

test('LoggerLogMessage_CallTransportLogWithoutStack_LogTypeIsTrueStackNotProvided', async () => {
  logger.logMessage('info', 'test');
  expect(logger.transport.log.mock.calls[0][0]).toEqual({ type: 'info', message: 'test' });
});

test('LoggerDataToString_ConvertArgumentToString_ArgumentIsNotAnObjectOrArray', async () => {
  const types = [1, null, undefined, () => {}, Symbol('sym'), true, 'string'];
  expect(logger.dataToString(types)).toEqual('\n1\nnull\nundefined\n() => {}\nSymbol(sym)\ntrue\nstring');
});

test('LoggerDataToString_ConvertArrayWithoutSpacing_ArgumentIsAnArray', async () => {
  const types = [[1, 2, 3, 4, 5]];
  expect(logger.dataToString(types)).toEqual('\n[1,2,3,4,5]');
});

test('LoggerDataToString_ConvertObjectWithSpacing_ArgumentIsAnObject', async () => {
  const types = [{ prop1: 1, prop2: 2 }];
  expect(logger.dataToString(types)).toEqual(`\n{\n  "prop1": 1,\n  "prop2": 2\n}`);
});
