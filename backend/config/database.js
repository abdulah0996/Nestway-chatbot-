const mongoose = require('mongoose');

let isConnected = false;
let lastConnectionError = null;

const redactMongoCredentials = (message) => String(message || 'Unknown MongoDB connection error')
    .replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, 'mongodb$1://[redacted]@');

const connectDB = async () => {
    try {
        const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_immigration_crm_db';
        const conn = await mongoose.connect(connStr, {
            // Hostinger runs Node 22, where DNS may prefer IPv6 even when the
            // container has no working IPv6 route to MongoDB Atlas.
            family: 4,
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
            socketTimeoutMS: 45000
        });

        isConnected = true;
        lastConnectionError = null;
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        isConnected = false;
        const safeMessage = redactMongoCredentials(error.message);
        lastConnectionError = {
            name: error.name || 'Error',
            code: error.code || null,
            message: safeMessage.slice(0, 500)
        };
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            message: `[Database] MongoDB connection failed (${error.name || 'Error'}): ${safeMessage}`
        }));
        return false;
    }
};

const getDBStatus = () => {
    return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
};

const getLastDBError = () => lastConnectionError;

mongoose.connection.on('connected', () => {
    isConnected = true;
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
});

module.exports = { connectDB, getDBStatus, getLastDBError };
