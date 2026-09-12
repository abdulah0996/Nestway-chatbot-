const mongoose = require('mongoose');
const dns = require('dns');
const net = require('net');

let isConnected = false;
let lastConnectionError = null;
let lastNetworkProbe = null;

const ATLAS_PROBE_HOST = 'ac-ad2fdxd-shard-00-00.lnrg0ts.mongodb.net';
const ATLAS_IPV4_BY_HOST = Object.freeze({
    'ac-ad2fdxd-shard-00-00.lnrg0ts.mongodb.net': '159.41.188.48',
    'ac-ad2fdxd-shard-00-01.lnrg0ts.mongodb.net': '159.41.188.73',
    'ac-ad2fdxd-shard-00-02.lnrg0ts.mongodb.net': '159.41.188.60'
});

const atlasIpv4Lookup = (hostname, options, callback) => {
    const address = ATLAS_IPV4_BY_HOST[String(hostname).toLowerCase()];
    if (!address) return dns.lookup(hostname, options, callback);
    if (options && typeof options === 'object' && options.all) {
        return callback(null, [{ address, family: 4 }]);
    }
    return callback(null, address, 4);
};

const probeDatabaseNetwork = () => new Promise((resolve) => {
    const socket = net.createConnection({
        host: ATLAS_PROBE_HOST,
        port: 27017,
        family: 4,
        lookup: atlasIpv4Lookup
    });
    let settled = false;
    let deadline;
    const finish = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(deadline);
        lastNetworkProbe = { ...result, checkedAt: new Date().toISOString() };
        socket.destroy();
        resolve(lastNetworkProbe);
    };

    deadline = setTimeout(() => finish({ status: 'timeout' }), 5000);
    socket.once('connect', () => finish({ status: 'connected' }));
    socket.once('error', (error) => finish({ status: 'error', code: error.code || null }));
});

const redactMongoCredentials = (message) => String(message || 'Unknown MongoDB connection error')
    .replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, 'mongodb$1://[redacted]@');

const expandKnownAtlasSrvUri = (connectionString) => {
    const match = String(connectionString).match(
        /^mongodb\+srv:\/\/([^@]+)@cluster0\.lnrg0ts\.mongodb\.net\/([^?]*)(?:\?(.*))?$/i
    );
    if (!match) return connectionString;

    const [, credentials, databaseName, existingQuery = ''] = match;
    const params = new URLSearchParams(existingQuery);
    params.set('tls', 'true');
    params.set('replicaSet', 'atlas-121sis-shard-0');
    params.set('authSource', 'admin');
    params.set('retryWrites', 'true');
    params.set('w', 'majority');

    const hosts = [
        'ac-ad2fdxd-shard-00-00.lnrg0ts.mongodb.net:27017',
        'ac-ad2fdxd-shard-00-01.lnrg0ts.mongodb.net:27017',
        'ac-ad2fdxd-shard-00-02.lnrg0ts.mongodb.net:27017'
    ].join(',');

    return `mongodb://${credentials}@${hosts}/${databaseName || 'ai_immigration_crm_db'}?${params.toString()}`;
};

const connectDB = async () => {
    try {
        const configuredUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_immigration_crm_db';
        const connStr = expandKnownAtlasSrvUri(configuredUri);
        const conn = await mongoose.connect(connStr, {
            // Hostinger runs Node 22, where DNS may prefer IPv6 even when the
            // container has no working IPv6 route to MongoDB Atlas.
            family: 4,
            lookup: atlasIpv4Lookup,
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
const getLastNetworkProbe = () => lastNetworkProbe;

mongoose.connection.on('connected', () => {
    isConnected = true;
});

mongoose.connection.on('disconnected', () => {
    isConnected = false;
});

module.exports = { connectDB, getDBStatus, getLastDBError, probeDatabaseNetwork, getLastNetworkProbe };
