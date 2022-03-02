const { randomUUID } = require('crypto');
const { parseCookies, parseHost } = require('./utils');
const { database } = require('./db');

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
  async save(session, db = database) {
    const { username, token } = session;
    const result = (await db.insert('Session', { username, token }, ['*'])) || {};
    return new Session(result.username, result.token, result.createdTime);
  }

  async delete(token, db = database) {
    const result = (await db.delete('Session', { token }, ['*'])) || {};
    return new Session(result.username, result.token, result.createdTime);
  }

  async restore(token, db = database) {
    const result = (await db.select('Session', ['*'], { token }))[0] || {};
    return new Session(result.username, result.token, result.createdTime);
  }
}

class SessionService {
  constructor() {
    this.sessionRepository = new SessionRepository();
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
    const session = await this.sessionRepository.restore(token);
    return session;
  }

  async startSession(request, response, username) {
    const session = new Session(username);
    const host = parseHost(request.headers.host);
    const cookie = `${TOKEN}=${session.token}; ${COOKIE_HOST}=${host}; SameSite=None; Secure; HttpOnly`;
    if (response) response.setHeader('Set-Cookie', cookie);
    await this.sessionRepository.save(session);
    return session;
  }

  endSession(request, response) {
    const host = parseHost(request.headers.host);
    const token = this.getTokenFromRequest(request);
    const cookie = `${COOKIE_DELETE}${host}; SameSite=None; Secure; HttpOnly`;
    if (response) response.setHeader('Set-Cookie', cookie);
    const session = this.sessionRepository.delete(token);
    return session;
  }
}
module.exports = {
  sessionService: new SessionService()
};
