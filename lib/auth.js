const { SecurityUtil } = require('./security-util');

class Auth {
  constructor() {
    this.security = new SecurityUtil();
  }

  async register({ username, password }, context) {
    const hashPassword = await this.security.hashPassword(password);
    const { role, createdTime } = await context.userService.save(username, hashPassword);
    await context.startSession(username);
    return { username, role, createdTime };
  }

  async login({ username, password }, context) {
    const session = context.session;
    if (session.username !== username) {
      const user = await context.userService.getByUsername(username);
      if (await this.security.validatePassword(password, user.password)) {
        await context.startSession(user);
      } else {
        throw new Error('Authentication failed!');
      }
    }
    return { username, role: context.user.role, createdTime: context.user.createdTime };
  }

  async logout(data, context) {
    await context.deleteSession();
  }

  async changePassword({ username, oldPassword, newPassword }, context) {
    const user = await context.user;
    if (await this.security.validatePassword(oldPassword, user.password)) {
      const newHashPassword = await this.security.hashPassword(newPassword);
      await context.userService.updatePassword(username, newHashPassword);
      return { username, role: user.role, createdTime: user.createdTime };
    } else {
      throw new Error('Password change failed!');
    }
  }
}

module.exports = { Auth };
