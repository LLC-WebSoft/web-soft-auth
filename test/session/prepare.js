const { sessionService } = require('../../lib/session');

jest.mock('../../lib/db', () => {
  return {
    database: {
      insert: () => {},
      delete: () => {},
      select: () => {}
    }
  };
});

jest.mock('crypto', () => {
  return {
    randomUUID: () => 'randomuuid'
  };
});

module.exports = {
  sessionService
};
