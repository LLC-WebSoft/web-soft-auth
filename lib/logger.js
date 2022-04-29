'use strict';
const { ConsoleTransport } = require('./console-transport');

class Logger {
  constructor() {
    this.transport = new ConsoleTransport();
    this.settings = {
      info: true,
      debug: true,
      warn: true,
      error: true,
      fatal: true,
      sql: true
    };
  }

  setSettings(settings) {
    if (typeof settings === 'object') {
      this.settings = { ...this.settings, ...settings };
    }
  }

  setTransport(transport) {
    if (typeof transport.log === 'function') {
      this.transport = transport;
    } else {
      throw new Error('Transport for Logger must have log method.');
    }
  }

  logMessage(type, message, stack) {
    if (this.settings[type] === true) {
      if (stack) {
        this.transport.log({ type, message, stack });
      } else {
        this.transport.log({ type, message });
      }
    }
  }

  info(...data) {
    this.logMessage('info', this.dataToString(data));
  }

  debug(...data) {
    this.logMessage('debug', this.dataToString(data));
  }

  warn(...data) {
    this.logMessage('warn', this.dataToString(data));
  }

  error(error) {
    this.logMessage('error', error.message, error.stack);
  }

  fatal(error) {
    this.logMessage('fatal', error.message, error.stack);
  }

  sql(...data) {
    this.logMessage('sql', this.dataToString(data));
  }

  dataToString(data) {
    try {
      let result = '';
      for (const element of data) {
        if (typeof element === 'object' && element !== null) {
          if (Array.isArray(element)) {
            result += `\n${JSON.stringify(element)}`;
          } else {
            result += `\n${JSON.stringify(element, null, 2)}`;
          }
        } else {
          result += `\n${String(element)}`;
        }
      }
      return result;
    } catch (error) {
      throw new Error(`Cannot parse data ${data} in logger ${error}.`);
    }
  }
}

console.log(some);

module.exports = {
  logger: new Logger()
};
