const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

const protect = async (req, res, next) => {
    if (!JWT_SECRET) {
        return res.status(500).json({ success: false, message: 'Authentication is not configured' });
    }

    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.id || decoded._id || decoded.userId;
        let user = null;

        // 1. Primary lookup: by decoded userId if valid ObjectId
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            user = await User.findById(userId).select('-password');
        }

        // Secondary lookup allows tokens issued before a user ID migration, but only
        // for the exact email carried by the signed token.
        if (!user && decoded.email) {
            user = await User.findOne({ email: decoded.email.toLowerCase() }).select('-password');
        }

        if (!user || !user.active) {
            return res.status(401).json({ success: false, message: 'User not found for this token' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('[AuthMiddleware] Token error:', error.message);
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user ? req.user.role : 'Guest'}' is not authorized to perform this action.`
            });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
