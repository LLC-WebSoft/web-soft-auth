const ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  UNAUTHORIZED: -40401,
  FORBIDDEN: -40403,
  BAD_REQUEST: -50400,
  INTERNAL_ERROR: -32603
};

class ConnectionError extends Error {
  constructor(code, message, data) {
    super(message);
    this.code = code;
    this.data = data;
  }
}

module.exports = {
  ERRORS,
  ConnectionError
};
