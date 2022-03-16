'use strict';
const { Connection } = require('./connection');
const { sessionService } = require('./session');

const MIME_TYPES = {
  json: 'application/json'
};

const HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true'
};

class HTTPConnection extends Connection {
  constructor(request, modules, response) {
    super(request, modules);
    this.response = response;
    this.response.on('close', () => {
      this.destroy();
    });
    this.cors = true;
  }

  setCors(value) {
    if (typeof value === 'boolean') {
      this.cors = value;
    }
  }

  write(data, type = 'json') {
    if (!this.response.writableEnded) {
      const mimeType = MIME_TYPES[type];
      this.response.writeHead(200, this.getHeaders(mimeType));
      this.response.end(data);
    }
  }

  send(data) {
    this.write(JSON.stringify(data), 'json');
  }

  getHeaders(mimeType) {
    const headers = { ...HEADERS };
    if (!this.cors && this.request.headers.origin) {
      headers['Access-Control-Allow-Origin'] = this.request.headers.origin;
    }
    if (mimeType && mimeType.length) {
      headers['Content-Type'] = mimeType;
    }
    return headers;
  }

  options() {
    if (!this.response.headersSent) {
      this.response.writeHead(200, this.getHeaders());
      this.response.end();
    }
  }

  async startUserSession(user) {
    return await sessionService.startSession(this.request, this.response, user.username);
  }

  async deleteUserSession() {
    await sessionService.endSession(this.request, this.response);
  }
}

module.exports = {
  HTTPConnection
};
