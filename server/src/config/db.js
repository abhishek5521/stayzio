const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    if (MONGODB_URI !== 'mongodb://127.0.0.1:27017/stayzio') {
      try {
        console.warn(`[Database Notice] Remote MongoDB unavailable (${error.message}). Connecting to local MongoDB...`);
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/stayzio', { serverSelectionTimeoutMS: 3000 });
        console.log(`[Database] Connected to local MongoDB: ${conn.connection.host}/${conn.connection.name}`);
        return;
      } catch (localErr) {
        console.error(`[Database Error] Local connection failed: ${localErr.message}`);
      }
    }
    console.error(`[Database Error] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
