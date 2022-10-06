'use strict';
class BodySizeError extends Error {
  constructor() {
    super('Body size is too huge.');
  }
}

class BodyRecieveError extends Error {
  constructor(error) {
    super('An error occurred while retrieving body data.');
    this.cause = error;
  }
}

const parseHost = (host) => {
  if (!host) {
    throw new Error('No host name in HTTP headers!');
  }
  const portOffset = host.indexOf(':');
  if (portOffset > -1) host = host.substr(0, portOffset);
  return host;
};

const parseCookies = (cookie) => {
  const values = {};
  const items = cookie.split(';');
  for (const item of items) {
    const parts = item.split('=');
    const key = parts[0].trim();
    const val = parts[1] || '';
    values[key] = val.trim();
  }
  return values;
};

const receiveBody = (request, max) =>
  new Promise((resolve, reject) => {
    const buffers = [];
    let size = 0;

    const onError = (error) => {
      reject(new BodyRecieveError(error));
    };

    const onEnd = () => {
      resolve(Buffer.concat(buffers));
    };

    const onData = (chunk) => {
      size += chunk.length;
      if (size > max) {
        request.removeListener('data', onData);
        request.removeListener('error', onError);
        request.removeListener('end', onEnd);
        reject(new BodySizeError());
      }
      buffers.push(chunk);
    };

    request.on('data', onData);
    request.on('error', onError);
    request.on('end', onEnd);
  });

const delay = (msec) =>
  new Promise((resolve) => {
    setTimeout(resolve, msec);
  });

module.exports = { parseHost, parseCookies, receiveBody, delay, BodySizeError, BodyRecieveError };
