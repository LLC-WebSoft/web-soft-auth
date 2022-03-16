'use strict';
const { Connection } = require('./connection');

class WSConnection extends Connection {
  constructor(request, modules, connection) {
    super(request, modules);
    this.connection = connection;
    connection.on('message', (data) => {
      if (!this.initialised) {
        this.on('initialised', () => {
          this.message(data);
        });
      } else {
        this.message(data);
      }
    });
    connection.on('close', () => {
      this.destroy();
    });
  }

  write(data) {
    this.connection.send(data);
  }

  send(data) {
    this.write(JSON.stringify(data));
  }
}

module.exports = { WSConnection };
