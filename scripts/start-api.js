const path = require('path');
require('dotenv').config();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const mainPath = path.resolve(__dirname, '../apps/api/dist/apps/api/src/main.js');
console.log('Loading API from:', mainPath);
require(mainPath);
