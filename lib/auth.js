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
    const sessionUsername = await this.sessionService.restoreSession(request);
    const { role, createdTime, hashPassword } = await this.userService.getByUsername(username);
    if (sessionUsername !== username) {
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
}

module.exports = { Auth };
