'use strict';
const { security } = require('./security-util');
const { userService } = require('./user');
const { ERRORS, ConnectionError } = require('./error');

class Auth {
  async register({ username, password }, context) {
    const hashPassword = await security.hashPassword(password);
    const { role, createdTime } = await userService.save(username, hashPassword);
    await context.startSession(username);
    return { username, role, createdTime };
  }

  async login({ username, password }, context) {
    const session = context.session;
    if (session.username !== username) {
      const user = await userService.getByUsername(username);
      if (await security.validatePassword(password, user.password)) {
        await context.startSession(user);
      } else {
        throw new ConnectionError(ERRORS.AUTHENTICATION_FAILED);
      }
    }
    return { username, role: context.user.role, createdTime: context.user.createdTime };
  }

  async logout(data, context) {
    await context.deleteSession();
  }

  async me(data, context) {
    const { username, role, createdTime } = context.user;
    return { username, role, createdTime };
  }

  async changePassword({ username, oldPassword, newPassword }, context) {
    const user = await context.user;
    if (await security.validatePassword(oldPassword, user.password)) {
      const newHashPassword = await security.hashPassword(newPassword);
      await userService.updatePassword(username, newHashPassword);
      return { username, role: user.role, createdTime: user.createdTime };
    } else {
      throw new ConnectionError(ERRORS.AUTHENTICATION_FAILED);
    }
  }
}

module.exports = { Auth };
