const User = require('../models/User');
const University = require('../models/University');
const Lead = require('../models/Lead');
const Counselor = require('../models/Counselor');
const { getDBStatus } = require('../config/database');

const seedDatabase = async () => {
    try {
        if (!getDBStatus()) {
            console.log('ℹ️ Skipping initial MongoDB seed check (Database offline/fallback active).');
            return;
        }

        const userCount = await User.countDocuments();
        if (userCount === 0) {
            const demoDataEnabled = process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO_DATA === 'true';

            if (!demoDataEnabled) {
                const adminEmail = String(process.env.INITIAL_ADMIN_EMAIL || '').trim().toLowerCase();
                const adminPassword = String(process.env.INITIAL_ADMIN_PASSWORD || '');
                const adminName = String(process.env.INITIAL_ADMIN_NAME || 'Nestway Admin').trim();

                if (!adminEmail || !adminEmail.includes('@') || adminPassword.length < 12) {
                    throw new Error('An empty production database requires INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD (minimum 12 characters).');
                }

                await User.create({
                    name: adminName,
                    email: adminEmail,
                    password: adminPassword,
                    role: 'ADMIN'
                });
                console.log('[Seed] Initial production admin created.');
                return;
            }

            console.log('🌱 Seeding initial users...');

            const admin = await User.create({
                name: 'System Admin',
                email: 'admin@immigration.com',
                password: 'admin123',
                role: 'ADMIN',
                phone: '+1 800 555 0199'
            });

            const counselor = await User.create({
                name: 'Sarah Jenkins (Senior Counselor)',
                email: 'counselor@immigration.com',
                password: 'counselor123',
                role: 'COUNSELOR',
                phone: '+1 800 555 0188'
            });

            const student = await User.create({
                name: 'Ali Raza',
                email: 'student@immigration.com',
                password: 'student123',
                role: 'STUDENT',
                phone: '+92 300 1234567'
            });

            console.log('✅ Demo Users Created:');
            console.log('   Admin: admin@immigration.com / admin123');
            console.log('   Counselor: counselor@immigration.com / counselor123');
            console.log('   Student: student@immigration.com / student123');

            // Seed Universities
            const uniCount = await University.countDocuments();
            if (uniCount === 0) {
                console.log('🌱 Seeding destination universities...');
                await University.insertMany([
                    {
                        name: 'University of Greenwich',
                        country: 'UK',
                        fees: '£14,500 / year',
                        requirements: { minCGPA: '2.8 / 4.0', minIELTS: '6.0 overall', acceptMOI: true },
                        intakes: ['Fall 2026', 'Spring 2027'],
                        courses: [
                            { name: 'MSc International Business', level: "Master's", duration: '1 Year', tuitionFee: '£15,000' },
                            { name: 'MSc Data Science & AI', level: "Master's", duration: '1 Year', tuitionFee: '£16,000' }
                        ],
                        featured: true
                    },
                    {
                        name: 'University of Melbourne',
                        country: 'Australia',
                        fees: 'AUD $38,000 / year',
                        requirements: { minCGPA: '3.3 / 4.0', minIELTS: '6.5 overall', acceptMOI: false },
                        intakes: ['Feb 2027', 'July 2027'],
                        courses: [
                            { name: 'Master of Information Technology', level: "Master's", duration: '2 Years', tuitionFee: 'AUD $42,000' }
                        ],
                        featured: true
                    },
                    {
                        name: 'Politecnico di Milano',
                        country: 'Italy',
                        fees: '€3,900 / year (Regional Scholarship Eligible)',
                        requirements: { minCGPA: '3.0 / 4.0', minIELTS: '6.0 overall', acceptMOI: true },
                        intakes: ['Sept 2026'],
                        courses: [
                            { name: 'MSc Computer Science & Engineering', level: "Master's", duration: '2 Years', tuitionFee: '€3,900' }
                        ],
                        featured: true
                    },
                    {
                        name: 'Technical University of Munich (TUM)',
                        country: 'Germany',
                        fees: '€1,500 / semester',
                        requirements: { minCGPA: '3.5 / 4.0', minIELTS: '7.0 overall', acceptMOI: false },
                        intakes: ['Winter 2026'],
                        courses: [
                            { name: 'MSc Informatics', level: "Master's", duration: '2 Years', tuitionFee: '€3,000' }
                        ],
                        featured: true
                    },
                    {
                        name: 'University of Debrecen',
                        country: 'Hungary',
                        fees: '$7,000 / year',
                        requirements: { minCGPA: '2.5 / 4.0', minIELTS: '5.5 overall', acceptMOI: true },
                        intakes: ['September 2026'],
                        courses: [
                            { name: 'BSc Computer Science', level: "Bachelor's", duration: '3 Years', tuitionFee: '$7,000' }
                        ],
                        featured: true
                    }
                ]);
            }

            // Seed Sample CRM Leads
            const leadCount = await Lead.countDocuments();
            if (leadCount === 0) {
                console.log('🌱 Seeding CRM leads pipeline...');
                await Lead.insertMany([
                    {
                        fullName: 'Muhammad Usman',
                        phone: '+92 321 9876543',
                        email: 'usman.lead@gmail.com',
                        source: 'Website AI Chatbot',
                        countryInterest: 'UK',
                        qualification: 'Bachelor in CS',
                        cgpa: '3.4 (78%)',
                        englishTest: 'IELTS',
                        englishScore: '7.0',
                        budget: '$15,000+',
                        intake: 'Fall 2026',
                        leadScore: 88,
                        status: 'QUALIFIED',
                        stage: 'AI Qualified',
                        assignedCounselor: counselor._id
                    },
                    {
                        fullName: 'Fatima Noor',
                        phone: '+92 333 4567890',
                        email: 'fatima.noor@outlook.com',
                        source: 'WhatsApp',
                        countryInterest: 'Italy',
                        qualification: 'BBA',
                        cgpa: '3.6 (82%)',
                        englishTest: 'MOI',
                        englishScore: 'Medium of Instruction',
                        budget: '$10,000 - $15,000',
                        intake: 'Sept 2026',
                        leadScore: 85,
                        status: 'MEETING_BOOKED',
                        stage: 'Meeting Booked',
                        assignedCounselor: counselor._id
                    },
                    {
                        fullName: 'Hamza Ahmed',
                        phone: '+92 301 5554433',
                        email: 'hamza.a@gmail.com',
                        source: 'Facebook Ads',
                        countryInterest: 'Australia',
                        qualification: 'BS Electrical',
                        cgpa: '3.1',
                        englishTest: 'PTE',
                        englishScore: '68',
                        budget: '$15,000+',
                        intake: 'Feb 2027',
                        leadScore: 82,
                        status: 'QUALIFIED',
                        stage: 'University Applied',
                        assignedCounselor: counselor._id
                    },
                    {
                        fullName: 'Zainab Bibi',
                        phone: '+92 312 7778899',
                        email: 'zainab.b@gmail.com',
                        source: 'Website AI Chatbot',
                        countryInterest: 'Hungary',
                        qualification: 'Intermediate',
                        cgpa: '85%',
                        englishTest: 'None',
                        englishScore: 'Planning',
                        budget: 'Under $10,000',
                        intake: 'September 2026',
                        leadScore: 78,
                        status: 'CONVERTED',
                        stage: 'Visa Approved',
                        assignedCounselor: counselor._id
                    }
                ]);
            }

            // Seed Specialized Counselors
            const counselorCount = await Counselor.countDocuments();
            if (counselorCount === 0) {
                console.log('🌱 Seeding specialized immigration counselors...');
                await Counselor.insertMany([
                    {
                        name: 'Ahmed Khan (UK & Europe Study Lead)',
                        email: 'ahmed.uk@immigration.com',
                        phone: '+44 7700 900123',
                        specialization: ['Study Visa', 'Scholarship Negotiation', 'CAS Issuance'],
                        visaTypes: ['STUDY_VISA'],
                        countries: ['UK', 'Germany', 'Italy', 'Hungary'],
                        active: true,
                        currentWorkload: 3
                    },
                    {
                        name: 'Sarah Jenkins (Skilled PR & Work Migration)',
                        email: 'sarah.pr@immigration.com',
                        phone: '+61 400 123 456',
                        specialization: ['Skilled Migration', 'Points Assessment', 'Express Entry'],
                        visaTypes: ['SKILLED_VISA'],
                        countries: ['Australia', 'Canada', 'UK'],
                        active: true,
                        currentWorkload: 2
                    },
                    {
                        name: 'Marcus Sterling (Business & Investor Visa)',
                        email: 'marcus.invest@immigration.com',
                        phone: '+1 416 555 0147',
                        specialization: ['Innovator Founder', 'Start-up Visa', 'Residency by Investment'],
                        visaTypes: ['BUSINESS_VISA'],
                        countries: ['UK', 'Canada', 'Australia', 'Europe'],
                        active: true,
                        currentWorkload: 1
                    },
                    {
                        name: 'Fatima Noor (Visit & Tourist Visa)',
                        email: 'fatima.visit@immigration.com',
                        phone: '+92 300 9876543',
                        specialization: ['Tourist Visa', 'Family Sponsor', 'Schengen & UK Visitor'],
                        visaTypes: ['VISIT_VISA'],
                        countries: ['UK', 'Schengen Europe', 'USA', 'Canada'],
                        active: true,
                        currentWorkload: 2
                    }
                ]);
            }
        }
    } catch (error) {
        console.error('Note seeding database:', error.message);
        if (process.env.NODE_ENV === 'production') {
            throw error;
        }
    }
};

module.exports = { seedDatabase };
