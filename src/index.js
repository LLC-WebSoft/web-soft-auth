const fs = require('fs');
const { Server, logger, AuthModule } = require('../index');
const modules = require('./modules');

const key = fs.readFileSync('./certs/localhost.key');
const cert = fs.readFileSync('./certs/localhost.crt');

const start = async () => {
  try {
    const server = new Server({ host: '0.0.0.0', port: 443, cors: false, key, cert, secure: true });
    server.start({ ...modules, auth: AuthModule });
  } catch (error) {
    logger.fatal(error);
  }
};

start();
