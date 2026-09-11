const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    try {
        const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_immigration_crm_db';
        const conn = await mongoose.connect(connStr, {
            serverSelectionTimeoutMS: 2500
        });

        isConnected = true;
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        isConnected = false;
        console.warn(`[Database] MongoDB Connection Note: ${error.message}`);
        console.warn('[Database] Database unavailable. API requires an active MongoDB connection.');
        return false;
    }
};

const getDBStatus = () => {
    return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
};

mongoose.connection.on('connected', () => {
    isConnected = true;
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
});

module.exports = { connectDB, getDBStatus };
