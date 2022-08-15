const { Server, logger } = require('../index');
const modules = require('./modules');

const start = async () => {
  try {
    let server = new Server(modules, { host: 'localhost', port: 80, cors: false });
  } catch (error) {
    logger.fatal(error);
  }
};

start();
