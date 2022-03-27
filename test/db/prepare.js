const { Pool } = require('pg');

const UNIQUE_ERROR_CODE_PREFIX = '23';

jest.mock('pg');
Pool.mockImplementation(() => {
  return {
    query: jest.fn(async (text) => {
      if (text === 'errorSql') {
        const error = new Error();
        error.code = '0';
        throw error;
      } else if (text === 'conflictErrorSql') {
        const error = new Error();
        error.code = UNIQUE_ERROR_CODE_PREFIX;
        throw error;
      } else {
        return { rows: [] };
      }
    })
  };
});

jest.mock('../../lib/logger', () => {
  return {
    logger: {
      sql: () => {}
    }
  };
});

//Require database after Pool is mocked. Database is singlton service and using Pool inside constructor.
const { database } = require('../../lib/db');

beforeEach(() => {
  database.pool.query.mockClear();
});

module.exports = {
  database
};
