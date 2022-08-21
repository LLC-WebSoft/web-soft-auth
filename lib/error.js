'use strict';
const ERRORS = {
  PARSE_ERROR: {
    code: -32700,
    message: 'Invalid JSON was received by the server.'
  },
  INVALID_REQUEST: {
    code: -32600,
    message: 'The JSON sent is not a valid Request object.'
  },
  METHOD_NOT_FOUND: {
    code: -32601,
    message: 'The method does not exist / is not available.'
  },
  INVALID_PARAMS: {
    code: -32602,
    message: 'Invalid method parameter(s).'
  },
  UNAUTHORIZED: {
    code: -40401,
    message: 'Authentication credentials required.'
  },
  FORBIDDEN: {
    code: -40403,
    message: 'Permission denied.'
  },
  INVALID_HTTP_METHOD: {
    code: -50400,
    message: 'Request method must be POST.'
  },
  INTERNAL_ERROR: {
    code: -32603,
    message: 'Internal server error.'
  },
  BAD_TRASPORT: {
    code: -50405,
    message: 'Inappropriate transport protocol.'
  },
  DATA_CONFLICT: {
    code: -40409,
    message: 'Conflict error.'
  },
  DATA_ERROR: {
    code: -40410,
    message: 'Data error.'
  },
  AUTHENTICATION_FAILED: {
    code: -40300,
    message: 'Authentication failed.'
  },
  SERVICE_UNAVAILABEL: {
    code: -40503,
    message: 'Service temporarily unavailable.'
  }
};

class ConnectionError extends Error {
  constructor({ code, message = '', internal = '' }, data) {
    super(message);
    this.code = code;
    this.data = data;
    this.internal = internal;
    this.pass = true;
  }
}

const registerError = (label, code, message = '') => {
  if (!label || !code) throw new Error('Label and code for new error types must be provided.');
  ERRORS[label] = { code, message };
  return ERRORS[label];
};

module.exports = {
  ERRORS,
  ConnectionError,
  registerError
};
