const { Server, logger, AuthModule } = require('../index');
const modules = require('./modules');

const start = async () => {
  try {
    const server = new Server({ host: '0.0.0.0', port: 8000, cors: false });
    server.start({ ...modules, auth: AuthModule });
  } catch (error) {
    logger.fatal(error);
  }
};

start();
