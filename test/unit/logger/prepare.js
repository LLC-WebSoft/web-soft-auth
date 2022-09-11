const { logger } = require('../../../lib/logger');

const DEFAULT_SETTINGS = {
  info: true,
  debug: true,
  warn: true,
  error: true,
  fatal: true,
  sql: true
};

const createFakeTransport = () => {
  return { log: jest.fn() };
};

beforeEach(() => {
  logger.setSettings(DEFAULT_SETTINGS);
  logger.transport = createFakeTransport();
});

module.exports = {
  logger,
  createFakeTransport,
  DEFAULT_SETTINGS
};
