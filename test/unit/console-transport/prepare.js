const { ConsoleTransport } = require('../../../lib/console-transport');

console.log = jest.fn();

beforeEach(() => {
  console.log.mockClear();
});

const createTransport = () => {
  const result = new ConsoleTransport();
  return result;
};

module.exports = {
  createTransport
};
