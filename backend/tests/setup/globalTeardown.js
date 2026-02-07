const path = require('path');
const fs = require('fs');

module.exports = async () => {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }

  // Clean up temp file
  const configPath = path.join(__dirname, '.test-mongo-uri');
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
};
