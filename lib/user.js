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

  save(user, db = this.db) {
    return db.insert('SystemUser', user);
  }

  async get(username, db = this.db) {
    const result = (await db.select('SystemUser', ['*'], { username }))[0];
    return new User(result.username, result.password, result.role, result.createdTime);
  }
}

module.exports = { User, UserRepository };
