const { User, UserRepository } = require('./user');
const { Session, SessionRepository } = require('./session');
const { SecurityUtil } = require('./security-util');
const { parseCookies, parseHost } = require('./utils');

const TOKEN = 'token';
const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const FUTURE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const LOCATION = 'Path=/; Domain';
const COOKIE_DELETE = `${TOKEN}=deleted; Expires=${EPOCH}; ${LOCATION}=`;
const COOKIE_HOST = `Expires=${FUTURE}; ${LOCATION}`;

class Auth {
  constructor(db) {
    this.db = db;
    this.userRepository = new UserRepository(db);
    this.sessionRepository = new SessionRepository(db);
    this.security = new SecurityUtil();
  }

  async register({ username, password }, request, response) {
    const hashPassword = await this.security.hashPassword(password);
    const user = new User(username, hashPassword);
    await this.userRepository.save(user);
    await this.startSession(request, response, new Session(username));
    delete user.password;
    return user;
  }

  async login({ username, password }, request, response) {
    const session = await this.restoreSession(request);
    const user = await this.userRepository.get(username);
    if (session.username !== username) {
      if (await this.security.validatePassword(password, user.password)) {
        await this.startSession(request, response, new Session(username));
      } else {
        throw new Error('Authentication failed!');
      }
    }
    delete user.password;
    return user;
  }

  async logout(request, response) {
    const session = await this.endSession(request, response);
    return { username: session.username };
  }

  getTokenFromRequest(request) {
    const { cookie } = request.headers;
    if (!cookie) return '';
    const cookies = parseCookies(cookie);
    const { token } = cookies;
    if (!token) return '';
  }

  async restoreSession(request) {
    const token = this.getTokenFromRequest(request);
    return this.sessionRepository.restoreSession(token);
  }

  startSession(request, response, session) {
    const host = parseHost(request.headers.host);
    const cookie = `${TOKEN}=${session.token}; ${COOKIE_HOST}=${host}; SameSite=None; Secure; HttpOnly`;
    if (response) response.setHeader('Set-Cookie', cookie);
    return this.sessionRepository.save(session);
  }

  endSession(request, response) {
    const host = parseHost(request.headers.host);
    const token = this.getTokenFromRequest(request);
    const cookie = `${COOKIE_DELETE}${host}; SameSite=None; Secure; HttpOnly`;
    if (response) response.setHeader('Set-Cookie', cookie);
    return this.sessionRepository.delete(token);
  }
}

module.exports = { Auth };
