const { User, UserRepository } = require('./user');
const { SecurityUtil } = require('./security-util');

class Auth {
  constructor(sessionService, db) {
    this.db = db;
    this.userRepository = new UserRepository(db);
    this.security = new SecurityUtil();
    this.sessionService = sessionService;
  }

  async register({ username, password }, request, response) {
    const hashPassword = await this.security.hashPassword(password);
    const user = new User(username, hashPassword);
    await this.userRepository.save(user);
    await this.sessionService.startSession(request, response, username);
    delete user.password;
    return user;
  }

  async login({ username, password }, request, response) {
    const sessionUsername = await this.sessionService.restoreSession(request);
    const user = await this.userRepository.get(username);
    if (sessionUsername !== username) {
      if (await this.security.validatePassword(password, user.password)) {
        await this.sessionService.startSession(request, response, username);
      } else {
        throw new Error('Authentication failed!');
      }
    }
    delete user.password;
    return user;
  }

  async logout(request, response) {
    const username = await this.sessionService.endSession(request, response);
    return { username };
  }
}

module.exports = { Auth };
