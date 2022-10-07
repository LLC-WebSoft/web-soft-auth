'use strict';
const { Connection } = require('./connection');
const { sessionService } = require('./session');
const { ConnectionError, ERRORS } = require('./error');
const { receiveBody } = require('./utils');

const MIME_TYPES = {
  json: 'application/json'
};

const HEADERS = {
  'X-XSS-Protection': '0',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Origin': '',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Strict-Transport-Security': 'max-age=63072000',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store'
};

class HTTPConnection extends Connection {
  constructor(request, modules, response, originList = []) {
    super(request, modules);
    this.response = response;
    this.response.on('close', () => {
      this.destroy();
    });
    this.cors = true;
    this.originList = originList;
  }

  async serveRequest(maxPayload) {
    if (this.request.method !== 'OPTIONS') {
      if (this.request.method === 'POST') {
        try {
          const body = await receiveBody(this.request, maxPayload);
          await this.initialise();
          await this.message(body);
        } catch (error) {
          this.handleError(error);
        }
      } else {
        throw new ConnectionError(ERRORS.INVALID_HTTP_METHOD);
      }
    } else {
      this.options();
    }
  }

  handleError(error) {
    switch (error.constructor.name) {
      case 'BodySizeError':
        throw new ConnectionError(ERRORS.MAX_PAYLOAD_SIZE_EXCEEDED);
      case 'BodyRecieveError':
        throw new ConnectionError(ERRORS.BODY_RECIEVE_ERROR);
      default:
        throw error;
    }
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
    const headers = { ...HEADERS, ...this.getCorsHeaders() };
    if (mimeType && mimeType.length) {
      headers['Content-Type'] = mimeType;
    }
    return headers;
  }

  getCorsHeaders() {
    const result = {};
    const origin = this.request.headers.origin || '';
    if (this.cors === false || this.originList.includes(origin)) {
      result['Access-Control-Allow-Origin'] = origin;
    } else {
      result['Access-Control-Allow-Origin'] = '';
    }

    return result;
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

class HTTPConnectionFactory {
  create(request, modules, response) {
    return new HTTPConnection(request, modules, response);
  }
}

module.exports = {
  HTTPConnectionFactory
};
