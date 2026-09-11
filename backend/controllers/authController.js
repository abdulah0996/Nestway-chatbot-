const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const generateToken = (id, role, email) => {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }
    return jwt.sign(
        { id, role, email },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public / Admin
const register = async (req, res) => {
    try {
        const { name, password, phone } = req.body;
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (typeof name !== 'string' || !name.trim() || !email || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Name, email and a password of at least 6 characters are required.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'STUDENT',
            phone: phone || ''
        });

        const token = generateToken(user._id, user.role, user.email);

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { password } = req.body;
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if (!email || typeof password !== 'string' || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        let user = await User.findOne({ email }).select('+password');
        if (!user) {
            const userCount = await User.countDocuments();
            if (userCount === 0) {
                try {
                    const { seedDatabase } = require('../utils/seedData');
                    await seedDatabase();
                    user = await User.findOne({ email }).select('+password');
                } catch (sErr) {
                    console.error('[AuthController] Auto seed error on login:', sErr);
                }
            }
        }

        if (!user || !user.active) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id, user.role, user.email);

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get list of counselors
// @route   GET /api/auth/counselors
// @access  Private / Public
const getCounselors = async (req, res) => {
    try {
        const counselors = await User.find({ role: 'COUNSELOR', active: true }).select('_id name email phone avatar');
        res.json({ success: true, data: counselors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    register,
    login,
    getMe,
    getCounselors,
    getUsers
};
