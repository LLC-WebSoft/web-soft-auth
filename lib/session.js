const { randomUUID } = require('crypto');

class Session {
  constructor(username = '', token = '', createdTime = '') {
    this.username = username;
    this.token = token.length ? token : randomUUID();
    this.createdTime = createdTime;
  }
}

class SessionRepository {
  constructor(db) {
    this.db = db;
  }

  save(session, db = this.db) {
    return db.insert('Session', session);
  }

  delete(token, db = this.db) {
    return db.delete('Session', { token });
  }

  async restore(token, db = this.db) {
    const result = (await db.select('Session', ['*'], { token }))[0];
    return new Session(result.username, result.token, result.createdTime);
  }
}

module.exports = { Session, SessionRepository };
