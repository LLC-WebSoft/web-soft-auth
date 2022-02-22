const { randomUUID } = require('crypto');
const { parseCookies, parseHost } = require('./utils');

const TOKEN = 'token';
const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const FUTURE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const LOCATION = 'Path=/; Domain';
const COOKIE_DELETE = `${TOKEN}=deleted; Expires=${EPOCH}; ${LOCATION}=`;
const COOKIE_HOST = `Expires=${FUTURE}; ${LOCATION}`;

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

  async save(session, db = this.db) {
    const result = await db.insert('Session', session);
    return new Session(result.username, result.token, result.createdTime);
  }

  async delete(token, db = this.db) {
    const result = await db.delete('Session', { token });
    return new Session(result.username, result.token, result.createdTime);
  }

  async restore(token, db = this.db) {
    const result = (await db.select('Session', ['*'], { token }))[0];
    return new Session(result.username, result.token, result.createdTime);
  }
}

class SessionService {
  constructor(db) {
    this.sessionRepository = new SessionRepository(db);
  }

  getTokenFromRequest(request) {
    const { cookie } = request.headers;
    if (!cookie) return '';
    const cookies = parseCookies(cookie);
    const { token } = cookies;
    if (!token) return '';
    return token;
  }

  async restoreSession(request) {
    const token = this.getTokenFromRequest(request);
    const session = await this.sessionRepository.restoreSession(token);
    return session.username;
  }

  async startSession(request, response, username) {
    const session = new Session(username);
    const host = parseHost(request.headers.host);
    const cookie = `${TOKEN}=${session.token}; ${COOKIE_HOST}=${host}; SameSite=None; Secure; HttpOnly`;
    if (response) response.setHeader('Set-Cookie', cookie);
    await this.sessionRepository.save(session);
    return session.username;
  }

  endSession(request, response) {
    const host = parseHost(request.headers.host);
    const token = this.getTokenFromRequest(request);
    const cookie = `${COOKIE_DELETE}${host}; SameSite=None; Secure; HttpOnly`;
    if (response) response.setHeader('Set-Cookie', cookie);
    const session = this.sessionRepository.delete(token);
    return session.username;
  }
}
module.exports = { Session, SessionRepository, SessionService };
