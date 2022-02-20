class User {
  constructor(username = '', password = '', role = 'user', createdTime = '') {
    this.username = username;
    this.password = password;
    this.role = role;
    this.createdTime = createdTime;
  }
}

class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async save(user, db = this.db) {
    const result = await db.insert('SystemUser', user);
    return new User(result.username, result.password, result.role, result.createdTime);
  }

  async get(username, db = this.db) {
    const result = (await db.select('SystemUser', ['*'], { username }))[0];
    return new User(result.username, result.password, result.role, result.createdTime);
  }
}

class UserService {
  constructor(db) {
    this.userRepository = new UserRepository(db);
  }

  async save(username, hashPassword) {
    const user = new User(username, hashPassword);
    const { role = '', createdTime = '' } = await this.userRepository.save(user);
    return { role, createdTime };
  }

  async getByUsername(username) {
    const user = await this.userRepository.get(username);
    return { username: user.username, role: user.role, createdTime: user.createdTime, hashPassword: user.password };
  }
}
module.exports = { User, UserRepository, UserService };
