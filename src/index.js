'use strict';
const { Server, logger } = require('../index');
const modules = require('./modules');

const start = async () => {
  try {
    const server = new Server({ host: '0.0.0.0', port: 8000, cors: true, allowOrigin: ['http://test-origin'] });
    server.start(modules);
  } catch (error) {
    logger.fatal(error);
  }
};

start();
