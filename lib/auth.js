const { User, UserRepository } = require('./user');
const { Session, SessionRepository } = require('./session');
const { SecurityUtil } = require('./security-util');

const TOKEN = 'token';
const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const FUTURE = 'Fri, 01 Jan 2100 00:00:00 GMT';
const LOCATION = 'Path=/; Domain';
const COOKIE_DELETE = `${TOKEN}=deleted; Expires=${EPOCH}; ${LOCATION}=`;
const COOKIE_HOST = `Expires=${FUTURE}; ${LOCATION}`;

const parseHost = (host) => {
  if (!host) {
    throw new Error('No host name in HTTP headers!');
  }
  const portOffset = host.indexOf(':');
  if (portOffset > -1) host = host.substr(0, portOffset);
  return host;
};

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

  startSession(request, response, session) {
    const host = parseHost(request.headers.host);
    const cookie = `${TOKEN}=${session.token}; ${COOKIE_HOST}=${host}`;
    if (response) response.setHeader('Set-Cookie', cookie);
    return this.sessionRepository.save(session);
  }
}

module.exports = { Auth };
