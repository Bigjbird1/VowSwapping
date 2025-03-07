const { cleanup } = require('./ensure-test-schema');

module.exports = async () => {
  await cleanup();
};
