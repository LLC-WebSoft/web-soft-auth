'use strict';
const { database } = require('./db');

class User {
  constructor(username = '', password = '', role = 'user', createdTime = '') {
    this.username = username;
    this.password = password;
    this.role = role;
    this.createdTime = createdTime;
  }
}

class UserRepository {
  async save(user, db = database) {
    const { username, password, role } = user;
    const result = (await db.insert('SystemUser', { username, password, role }, ['*'])) || {};
    return new User(result.username, result.password, result.role, result.createdTime);
  }

  async get(username, db = database) {
    const result = (await db.select('SystemUser', ['*'], { username }))[0] || {};
    return new User(result.username, result.password, result.role, result.createdTime);
  }

  async update(username, data, db = database) {
    const result = (await db.update('SystemUser', data, { username }, ['*']))[0] || {};
    return new User(result.username, result.password, result.role, result.createdTime);
  }
}

class UserService {
  constructor() {
    this.userRepository = new UserRepository();
  }

  async save(username, hashPassword) {
    const user = new User(username, hashPassword);
    return await this.userRepository.save(user);
  }

  getByUsername(username) {
    return this.userRepository.get(username);
  }

  async updatePassword(username, password) {
    const { role = '', createdTime = '' } = await this.userRepository.update(username, { password });
    return { role, createdTime };
  }
}
module.exports = {
  userService: new UserService(),
  UserService
};
