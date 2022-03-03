const { consoleTransport } = require('./console-transport');

class Logger {
  constructor() {
    this.transport = consoleTransport;
  }

  setTransport(transport) {
    if (typeof transport.log === 'function') {
      this.transport = transport;
    } else {
      throw new Error('Transport for Logger must have log method.');
    }
  }

  info(...data) {
    const message = { type: 'info', message: this.dataToString(data) };
    this.transport.log(message);
  }

  debug(...data) {
    const message = { type: 'debug', message: this.dataToString(data) };
    this.transport.log(message);
  }

  warn(...data) {
    const message = { type: 'warn', message: this.dataToString(data) };
    this.transport.log(message);
  }

  error(error) {
    const message = { type: 'error', message: error.message, stack: error.stack };
    this.transport.log(message);
  }

  fatal(error) {
    const message = { type: 'fatal', message: error.message, stack: error.stack };
    this.transport.log(message);
  }

  sql(...data) {
    const message = { type: 'sql', message: this.dataToString(data) };
    this.transport.log(message);
  }

  dataToString(data) {
    try {
      let result = '';
      for (const element of data) {
        if (typeof element === 'object' && element !== null) {
          result += `\n${JSON.stringify(element, null, 2)}`;
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

module.exports = {
  logger: new Logger()
};
