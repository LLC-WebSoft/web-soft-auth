'use strict';
const { Connection } = require('./connection');

class WSConnection extends Connection {
  constructor(request, modules, connection) {
    super(request, modules);
    this.connection = connection;
    connection.on('message', this.handleMessage.bind(this));
    connection.on('close', this.handleClose.bind(this));
  }

  handleMessage(data) {
    if (!this.initialised) {
      this.on('initialised', () => {
        this.message(data);
      });
    } else {
      this.message(data);
    }
  }

  handleClose() {
    this.destroy();
  }

  write(data) {
    this.connection.send(data);
  }

  send(data) {
    this.write(JSON.stringify(data));
  }
}

class WSConnectionFactory {
  create(request, modules, connection) {
    return new WSConnection(request, modules, connection);
  }
}

module.exports = {
  WSConnectionFactory
};
