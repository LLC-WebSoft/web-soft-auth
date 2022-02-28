const { SecurityUtil } = require('./security-util');

class Auth {
  constructor(sessionService, userService) {
    this.security = new SecurityUtil();
    this.sessionService = sessionService;
    this.userService = userService;
  }

  async register({ username, password }, request, response) {
    const hashPassword = await this.security.hashPassword(password);
    const { role, createdTime } = await this.userService.save(username, hashPassword);
    await this.sessionService.startSession(request, response, username);
    return { username, role, createdTime };
  }

  async login({ username, password }, request, response) {
    const session = await this.sessionService.restoreSession(request);
    const { role, createdTime, hashPassword } = await this.userService.getByUsername(username);
    if (session.username !== username) {
      if (await this.security.validatePassword(password, hashPassword)) {
        await this.sessionService.startSession(request, response, username);
      } else {
        throw new Error('Authentication failed!');
      }
    }
    return { username, role, createdTime };
  }

  async logout(request, response) {
    const username = await this.sessionService.endSession(request, response);
    return { username };
  }

  async changePassword({ username, oldPassword, newPassword }) {
    const { role, createdTime, hashPassword } = await this.userService.getByUsername(username);
    if (await this.security.validatePassword(oldPassword, hashPassword)) {
      const newHashPassword = await this.security.hashPassword(newPassword);
      await this.userService.updatePassword(username, newHashPassword);
      return { username, role, createdTime };
    } else {
      throw new Error('Password change failed!');
    }
  }
}

module.exports = { Auth };
