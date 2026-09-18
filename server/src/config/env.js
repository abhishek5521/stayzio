const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const rawMongoUri = process.env.MONGODB_URI;
const isMongoUriValid =
  rawMongoUri &&
  !rawMongoUri.includes('<db_password>') &&
  (rawMongoUri.startsWith('mongodb://') || rawMongoUri.startsWith('mongodb+srv://'));

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: isMongoUriValid ? rawMongoUri : 'mongodb://127.0.0.1:27017/stayzio',
  JWT_SECRET: process.env.JWT_SECRET || 'stayzio_super_secret_production_key_faang_grade_2026_jwt_token',
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
