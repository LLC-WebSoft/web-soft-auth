'use strict';
const COLORS = {
  info: '\x1b[40m\x1b[32m%s\x1b[0m',
  debug: '\x1b[40m\x1b[37m%s\x1b[0m',
  warn: '\x1b[40m\x1b[35m%s\x1b[0m',
  error: '\x1b[40m\x1b[33m%s\x1b[0m',
  fatal: '\x1b[40m\x1b[31m%s\x1b[0m',
  sql: '\x1b[40m\x1b[36m%s\x1b[0m'
};

class ConsoleTransport {
  log(data) {
    const message = data.stack || data.message;
    console.log(COLORS[data.type], message);
  }
}

module.exports = {
  consoleTransport: new ConsoleTransport()
};
