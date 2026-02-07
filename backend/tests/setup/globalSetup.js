const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Store URI in a temp file for workers to read
  const configPath = path.join(__dirname, '.test-mongo-uri');
  fs.writeFileSync(configPath, uri);

  // Store instance for teardown
  global.__MONGOD__ = mongod;
};
