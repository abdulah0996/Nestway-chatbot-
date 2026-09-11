const Counselor = require('../models/Counselor');
const User = require('../models/User');

/**
 * Intelligent Counselor Assignment Service
 * Matches by: Service Type, Country Specialization, Active Status, and Lowest Workload
 */
async function assignCounselorToLead({ serviceType, preferredCountry }) {
    try {
        // 1. Try matching in specialized Counselor collection
        let candidates = await Counselor.find({
            active: true,
            visaTypes: serviceType
        });

        // If country-specific candidates exist, filter by country
        if (preferredCountry && candidates.length > 0) {
            const countryMatched = candidates.filter(c =>
                c.countries && c.countries.some(country =>
                    country.toLowerCase().includes(preferredCountry.toLowerCase()) ||
                    preferredCountry.toLowerCase().includes(country.toLowerCase())
                )
            );
            if (countryMatched.length > 0) {
                candidates = countryMatched;
            }
        }

        // Sort by lowest current workload
        if (candidates.length > 0) {
            candidates.sort((a, b) => a.currentWorkload - b.currentWorkload);
            const bestCounselor = candidates[0];

            // Increment workload atomically
            await Counselor.findByIdAndUpdate(bestCounselor._id, {
                $inc: { currentWorkload: 1 }
            });

            return {
                counselorId: bestCounselor.userId || bestCounselor._id,
                name: bestCounselor.name,
                email: bestCounselor.email,
                phone: bestCounselor.phone,
                type: 'Counselor'
            };
        }

        // 2. Fallback to User collection with COUNSELOR role
        const fallbackCounselor = await User.findOne({ role: 'COUNSELOR', active: true });
        if (fallbackCounselor) {
            return {
                counselorId: fallbackCounselor._id,
                name: fallbackCounselor.name,
                email: fallbackCounselor.email,
                phone: fallbackCounselor.phone,
                type: 'User'
            };
        }

        // 3. Fallback to Admin
        const adminUser = await User.findOne({ role: 'ADMIN' });
        if (adminUser) {
            return {
                counselorId: adminUser._id,
                name: adminUser.name,
                email: adminUser.email,
                phone: adminUser.phone,
                type: 'User'
            };
        }

        return null;
    } catch (error) {
        console.error('[CounselorAssignment] Assignment error:', error.message);
        return null;
    }
}

module.exports = {
    assignCounselorToLead
};
