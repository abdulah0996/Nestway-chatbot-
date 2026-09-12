const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const {
    connectDB,
    getDBStatus,
    getLastDBError,
    probeDatabaseNetwork,
    getLastNetworkProbe
} = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { seedDatabase } = require('./utils/seedData');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const leadRoutes = require('./routes/leadRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const documentRoutes = require('./routes/documentRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const universityRoutes = require('./routes/universityRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const counselorRoutes = require('./routes/counselorRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database & Seed Initial Data (active)

// Production Security & Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(cors({
    origin: (origin, callback) => {
        const configuredOrigin = String(process.env.FRONTEND_URL || '').replace(/\/$/, '');
        const normalizedOrigin = String(origin || '').replace(/\/$/, '');
        const allowed = !origin || process.env.NODE_ENV !== 'production' || normalizedOrigin === configuredOrigin;
        callback(allowed ? null : new Error('Origin is not allowed by CORS'), allowed);
    },
    credentials: true
}));
app.use(express.json({
    limit: '10mb',
    verify: (req, res, buffer) => {
        if (req.originalUrl.startsWith('/api/whatsapp/webhook')) {
            req.rawBody = Buffer.from(buffer);
        }
    }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static Uploads & SPA Assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// API Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/chat', chatbotRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/counselors', counselorRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
    const databaseConnected = getDBStatus();
    if (!databaseConnected && !getLastNetworkProbe()) {
        await probeDatabaseNetwork();
    }
    res.status(databaseConnected ? 200 : 503).json({
        status: databaseConnected ? 'OK' : 'UNAVAILABLE',
        database: databaseConnected ? 'connected' : 'disconnected',
        ...(!databaseConnected && getLastDBError() ? { databaseError: getLastDBError() } : {}),
        ...(!databaseConnected && getLastNetworkProbe() ? { databaseNetwork: getLastNetworkProbe() } : {}),
        release: 'database-connectivity-inline-probe',
        project: 'AI Immigration Assistant & Student CRM',
        timestamp: new Date().toISOString()
    });
});

// SPA Fallback Route for React Client
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
});

app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/dist/index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(200).send('AI Immigration Assistant Backend Server Running. (Frontend build in progress)');
    }
});

// Centralized Error Handler
app.use(errorHandler);

// Start Express Server
async function initializeDatabase() {
    if (!getDBStatus() && !await connectDB()) {
        return false;
    }
    await seedDatabase();
    return true;
}

function retryDatabaseConnection() {
    let retryInProgress = false;
    const retryTimer = setInterval(async () => {
        if (retryInProgress) return;
        retryInProgress = true;
        try {
            if (await initializeDatabase()) {
                console.log('[Database] Connection restored; stopping retry loop.');
                clearInterval(retryTimer);
            }
        } catch (error) {
            console.warn(`[Database] Retry failed: ${error.message}`);
        } finally {
            retryInProgress = false;
        }
    }, 30000);
    retryTimer.unref();
}

async function startServer() {
    if (!process.env.JWT_SECRET) {
        throw new Error('Cannot start without JWT_SECRET. Configure a strong production secret.');
    }

    const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  AI IMMIGRATION ASSISTANT & STUDENT CRM BACKEND SERVER `);
    console.log(`  Server running on http://localhost:${PORT}`);
    console.log(`  Health check: http://localhost:${PORT}/api/health`);
    console.log(`  AI Chatbot API: http://localhost:${PORT}/api/chat/message`);
    console.log(`=======================================================`);
    }).on('error', (error) => {
        console.error(error.code === 'EADDRINUSE'
            ? `Port ${PORT} is already in use. Stop the existing server or set PORT to another value.`
            : error.message);
        require('mongoose').disconnect().finally(() => { process.exitCode = 1; });
    });

    // Open the HTTP port immediately so managed hosts can complete their
    // startup health check while Atlas DNS/TLS negotiation runs in parallel.
    probeDatabaseNetwork().catch(() => null);
    initializeDatabase()
        .then((initialized) => {
            if (!initialized) {
                console.warn('[Database] Web server is in degraded mode; retrying MongoDB every 30 seconds.');
                retryDatabaseConnection();
            }
        })
        .catch((error) => {
            console.error(`[Database] Startup initialization failed: ${error.message}`);
            if (!getDBStatus()) retryDatabaseConnection();
        });

    return server;
}

if (require.main === module) {
    startServer().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = app;
module.exports.startServer = startServer;
