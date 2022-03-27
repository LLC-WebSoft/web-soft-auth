const { security } = require('../../lib/security-util');
const { userService } = require('../../lib/user');
const { Auth } = require('../../lib/auth');

jest.mock('../../lib/security-util', () => {
  return {
    security: {
      validatePassword: jest.fn((password) => {
        return password === 'testPassword';
      }),
      hashPassword: jest.fn()
    }
  };
});

jest.mock('../../lib/user', () => {
  return {
    userService: {
      getByUsername: jest.fn((username) => {
        return { username, password: 'testPassword' };
      }),
      updatePassword: jest.fn()
    }
  };
});

beforeEach(() => {
  userService.getByUsername.mockClear();
  security.validatePassword.mockClear();
  userService.updatePassword.mockClear();
});

const createAuth = () => {
  const result = new Auth();
  return result;
};

const getContext = (session = {}, user = {}) => {
  const result = {};
  result.startSession = jest.fn(() => {});
  result.session = session;
  result.user = user;
  return result;
};

module.exports = {
  createAuth,
  getContext,
  userService
};
