/**
 * Dynamic Qualification Engine for Multiple Immigration Services
 * Supports: STUDY_VISA, SKILLED_VISA, BUSINESS_VISA, VISIT_VISA
 * Enforces AI safety: No guaranteed visa promises, clear confidence handling & escalation
 */

const IMMIGRATION_SERVICES = {
    STUDY_VISA: {
        id: 'STUDY_VISA',
        name: 'Study Visa',
        icon: '🎓',
        description: 'Undergraduate, Postgraduate & PhD Admissions with Scholarship Evaluation',
        questions: [
            {
                field: 'preferredCountry',
                text: 'Welcome to our Study Abroad AI Advisor! 🎓\n\nWhich destination country are you targeting for your studies?',
                options: [
                    { label: '🇬🇧 United Kingdom', value: 'UK' },
                    { label: '🇦🇺 Australia', value: 'Australia' },
                    { label: '🇨🇦 Canada', value: 'Canada' },
                    { label: '🇩🇪 Germany', value: 'Germany' },
                    { label: '🇮🇹 Italy', value: 'Italy' }
                ]
            },
            {
                field: 'highestQualification',
                text: 'What is your highest completed or in-progress academic qualification?',
                options: [
                    { label: '🎓 Bachelor\'s Degree (4 Years)', value: 'Bachelor\'s Degree' },
                    { label: '🏫 High School / Intermediate (A-Levels / FSc)', value: 'High School' },
                    { label: '📜 Master\'s Degree / MPhil', value: 'Master\'s Degree' },
                    { label: '🔬 Post-Graduate Diploma', value: 'Diploma' }
                ]
            },
            {
                field: 'cgpaOrPercentage',
                text: 'What is your CGPA or overall percentage in your highest qualification?',
                options: [
                    { label: '🌟 3.5+ CGPA (80%+)', value: '3.6 (82%)' },
                    { label: '👍 3.0 - 3.4 CGPA (70-79%)', value: '3.2 (74%)' },
                    { label: '👌 2.5 - 2.9 CGPA (60-69%)', value: '2.7 (64%)' },
                    { label: '📘 Below 2.5 CGPA', value: '2.3 (54%)' }
                ]
            },
            {
                field: 'englishTest',
                text: 'Do you have an English Language Proficiency test result ready?',
                options: [
                    { label: '🔤 IELTS Academic (6.0 - 7.5+)', value: 'IELTS' },
                    { label: '⚡ PTE Academic (58 - 75+)', value: 'PTE' },
                    { label: '🏫 MOI (Medium of Instruction Letter)', value: 'MOI' },
                    { label: '⏳ Not Taken Yet (Planning to take)', value: 'None' }
                ]
            },
            {
                field: 'targetIntake',
                text: 'Which academic intake are you planning to join?',
                options: [
                    { label: '🍁 Fall 2026 (September / October)', value: 'Fall 2026' },
                    { label: '🌸 Spring 2027 (January / February)', value: 'Spring 2027' },
                    { label: '☀️ Summer 2027', value: 'Summer 2027' }
                ]
            },
            {
                field: 'budgetRange',
                text: 'What is your estimated annual tuition and living budget range?',
                options: [
                    { label: '💰 £15,000+ / A$30,000+ / $20,000+', value: 'High ($20k+)' },
                    { label: '💵 £10,000 - £15,000 / $12,000 - $20,000', value: 'Medium ($12k-20k)' },
                    { label: '💶 Under £10,000 (Looking for Scholarships)', value: 'Low (<$12k)' }
                ]
            }
        ]
    },

    SKILLED_VISA: {
        id: 'SKILLED_VISA',
        name: 'Skilled Immigration',
        icon: '💼',
        description: 'Permanent Residency (PR) & Work Migration for Experienced Professionals',
        questions: [
            {
                field: 'destinationCountry',
                text: 'Welcome to Skilled Migration AI! 💼\n\nWhich destination country are you interested in for permanent residence or work visa?',
                options: [
                    { label: '🇦🇺 Australia (Subclass 189 / 190 / 491)', value: 'Australia' },
                    { label: '🇨🇦 Canada (Express Entry / PNP)', value: 'Canada' },
                    { label: '🇬🇧 UK (Skilled Worker Visa)', value: 'UK' },
                    { label: '🇩🇪 Germany (Opportunity Card / Blue Card)', value: 'Germany' }
                ]
            },
            {
                field: 'ageBracket',
                text: 'What is your current age bracket? (Points tested)',
                options: [
                    { label: '25 - 32 Years (Maximum Points)', value: '25-32' },
                    { label: '18 - 24 Years', value: '18-24' },
                    { label: '33 - 39 Years', value: '33-39' },
                    { label: '40 - 44 Years', value: '40-44' },
                    { label: '45+ Years', value: '45+' }
                ]
            },
            {
                field: 'highestQualification',
                text: 'What is your highest level of completed education?',
                options: [
                    { label: '📜 Master\'s Degree / PhD', value: 'Master\'s / PhD' },
                    { label: '🎓 Bachelor\'s Degree (4 Years)', value: 'Bachelor\'s Degree' },
                    { label: '📘 3-Year Diploma / Trade Qualification', value: 'Diploma' }
                ]
            },
            {
                field: 'occupationSector',
                text: 'Which field/occupation best describes your career?',
                options: [
                    { label: '💻 IT / Software / Data / Cyber Security', value: 'IT & Software' },
                    { label: '🩺 Healthcare / Nursing / Medical', value: 'Healthcare' },
                    { label: '⚙️ Engineering (Civil / Mech / Elec)', value: 'Engineering' },
                    { label: '📊 Accounting / Finance / Banking', value: 'Finance' },
                    { label: '🏢 Management / Marketing / Other', value: 'Management' }
                ]
            },
            {
                field: 'workExperienceYears',
                text: 'How many years of relevant full-time professional experience do you have?',
                options: [
                    { label: '🌟 5+ Years (Extensive Experience)', value: '5+ Years' },
                    { label: '👍 3 - 5 Years', value: '3-5 Years' },
                    { label: '👌 1 - 3 Years', value: '1-3 Years' },
                    { label: '⏳ Under 1 Year', value: '<1 Year' }
                ]
            },
            {
                field: 'englishProficiency',
                text: 'What is your English language test standing (IELTS / PTE)?',
                options: [
                    { label: '🌟 Superior / Band 8.0+ / PTE 79+ (20 Points)', value: 'Superior' },
                    { label: '👍 Proficient / Band 7.0+ / PTE 65+ (10 Points)', value: 'Proficient' },
                    { label: '👌 Competent / Band 6.0+ / PTE 50+', value: 'Competent' },
                    { label: '⏳ Not Taken Yet', value: 'None' }
                ]
            }
        ]
    },

    BUSINESS_VISA: {
        id: 'BUSINESS_VISA',
        name: 'Business & Investor Visa',
        icon: '🏢',
        description: 'Entrepreneur, Startup, Investor & Corporate Expansion Pathways',
        questions: [
            {
                field: 'destinationCountry',
                text: 'Welcome to Business & Investor Immigration! 🏢\n\nWhich country do you want to invest in or establish a business in?',
                options: [
                    { label: '🇬🇧 UK (Innovator Founder & Expansion)', value: 'UK' },
                    { label: '🇨🇦 Canada (Start-Up Visa & Intra-Company)', value: 'Canada' },
                    { label: '🇦🇺 Australia (Business Innovation & Investor)', value: 'Australia' },
                    { label: '🇪🇺 Europe (Golden Visa / Residency by Investment)', value: 'Europe' }
                ]
            },
            {
                field: 'businessStructure',
                text: 'What type of business investment do you plan to undertake?',
                options: [
                    { label: '💡 Innovative Tech / Scalable Startup', value: 'Tech Startup' },
                    { label: '🏬 Acquisition / Buying Existing Business', value: 'Business Acquisition' },
                    { label: '🏢 Opening Foreign Branch / Subsidiary', value: 'Branch Expansion' },
                    { label: '📈 Passive Real Estate / Fund Investment', value: 'Passive Investment' }
                ]
            },
            {
                field: 'businessExperience',
                text: 'What is your background in business ownership or senior corporate management?',
                options: [
                    { label: '👑 5+ Years as Business Owner / Director', value: '5+ Years Owner' },
                    { label: '👔 3 - 5 Years Senior Corporate Executive (C-Suite)', value: 'Senior Executive' },
                    { label: '💼 1 - 3 Years Entrepreneurial Experience', value: '1-3 Years' },
                    { label: '🌱 First-time Investor', value: 'First-time' }
                ]
            },
            {
                field: 'investmentCapital',
                text: 'What is your available investment liquid capital range?',
                options: [
                    { label: '💎 $300,000+ / £250,000+', value: '$300,000+' },
                    { label: '💰 $150,000 - $300,000', value: '$150,000-$300,000' },
                    { label: '💵 $75,000 - $150,000', value: '$75,000-$150,000' },
                    { label: '⏳ Under $75,000', value: '<$75,000' }
                ]
            },
            {
                field: 'primaryObjective',
                text: 'What is your primary commercial or family objective?',
                options: [
                    { label: '👨‍👩‍👧 Permanent Residency / Citizenship for Family', value: 'PR & Citizenship' },
                    { label: '🌍 Global Business Expansion & New Markets', value: 'Market Expansion' },
                    { label: '🛡️ Asset Diversification & Wealth Preservation', value: 'Wealth Preservation' }
                ]
            },
            {
                field: 'targetTimeline',
                text: 'What is your desired deployment timeline?',
                options: [
                    { label: '⚡ Immediate (Within 1 - 3 Months)', value: '1-3 Months' },
                    { label: '📅 3 - 6 Months', value: '3-6 Months' },
                    { label: '🗓️ 6 - 12 Months', value: '6-12 Months' }
                ]
            }
        ]
    },

    VISIT_VISA: {
        id: 'VISIT_VISA',
        name: 'Visit & Tourist Visa',
        icon: '✈️',
        description: 'Tourist, Family Visit, Medical & Business Visitor Visas',
        questions: [
            {
                field: 'destinationCountry',
                text: 'Welcome to Visit & Tourist Visa Assistant! ✈️\n\nWhich destination country are you planning to visit?',
                options: [
                    { label: '🇬🇧 United Kingdom (Standard Visitor)', value: 'UK' },
                    { label: '🇪🇺 Schengen Europe (Tourist / Family)', value: 'Schengen Europe' },
                    { label: '🇺🇸 United States (B1 / B2 Tourist)', value: 'USA' },
                    { label: '🇨🇦 Canada (Visitor Visa)', value: 'Canada' },
                    { label: '🇦🇺 Australia (Visitor Subclass 600)', value: 'Australia' }
                ]
            },
            {
                field: 'visitPurpose',
                text: 'What is the primary purpose of your trip?',
                options: [
                    { label: '🏖️ Tourism / Holiday / Sightseeing', value: 'Tourism' },
                    { label: '👨‍👩‍👧 Visiting Family or Friends', value: 'Family Visit' },
                    { label: '💼 Attending Business Meeting / Conference', value: 'Business Conference' },
                    { label: '🏥 Medical Treatment / Health', value: 'Medical' }
                ]
            },
            {
                field: 'plannedDuration',
                text: 'How long do you intend to stay during this visit?',
                options: [
                    { label: '⚡ Short Stay (1 - 2 Weeks)', value: '1-2 Weeks' },
                    { label: '📅 Moderate Stay (3 - 4 Weeks)', value: '3-4 Weeks' },
                    { label: '🗓️ Extended Stay (1 - 3 Months)', value: '1-3 Months' }
                ]
            },
            {
                field: 'travelHistory',
                text: 'What does your international travel history look like in the past 5 years?',
                options: [
                    { label: '🌍 Visited UK / USA / Canada / Schengen / Australia', value: 'Tier 1 Travel History' },
                    { label: '✈️ Visited UAE / Turkey / Malaysia / Thailand / Gulf', value: 'Regional Travel History' },
                    { label: '📘 First-Time International Traveler (Fresh Passport)', value: 'Fresh Passport' }
                ]
            },
            {
                field: 'employmentStatus',
                text: 'What is your current occupational and economic standing?',
                options: [
                    { label: '👔 Salaried Corporate Employee with NOC Letter', value: 'Employed' },
                    { label: '🏢 Registered Business Owner / Taxpayer', value: 'Business Owner' },
                    { label: '🎓 Enrolled Student with Leave Letter', value: 'Student' },
                    { label: '💻 Freelancer / Independent Professional', value: 'Freelancer' }
                ]
            },
            {
                field: 'financialReadiness',
                text: 'Do you have a verifiable bank statement ready with maintaining balance?',
                options: [
                    { label: '✅ Yes, 6-Month Healthy Bank Statement Ready', value: 'Ready Statement' },
                    { label: '🤝 Sponsored by Family / Host in Destination Country', value: 'Sponsored' },
                    { label: '⏳ In Progress (Will be ready in 2-4 weeks)', value: 'In Progress' }
                ]
            }
        ]
    }
};

/**
 * Step 1: Welcome & Ask Full Name
 */
function getWelcomeAndNamePrompt() {
    return {
        stage: 'NAME',
        message: `Welcome to **AI WhatsApp Immigration Assistant**! 🌍\n\nI am your 24/7 automated immigration advisor.\n\nMay I know your full name?`,
        options: [],
        actionChips: []
    };
}

/**
 * Step 2: Ask Phone Number (For website users)
 */
function getPhonePrompt(fullName = '') {
    const greeting = fullName ? `Thank you, **${fullName}**! 📱\n\n` : '';
    return {
        stage: 'PHONE',
        message: `${greeting}Please provide your WhatsApp or phone number (with country code):`,
        options: [],
        actionChips: []
    };
}

/**
 * Step 3: Ask Email (Optional)
 */
function getEmailPrompt(fullName = '', autoPhone = null) {
    let note = '';
    if (autoPhone) {
        note = `Thank you, **${fullName || 'there'}**! We have captured your WhatsApp number (**${autoPhone}**).\n\n`;
    } else {
        note = `Thank you! 📧\n\n`;
    }

    return {
        stage: 'EMAIL',
        message: `${note}What is your email address? (Optional - you can type your email address or tap Skip below):`,
        options: [
            { label: '⏭️ Skip Email', value: 'SKIP', action: 'skip_email' }
        ],
        actionChips: [
            { label: '⏭️ Skip Email', action: 'SKIP' }
        ]
    };
}

/**
 * Step 4: Ask Immigration Service Selection
 * (Study Visa, Skilled Immigration, Business Visa, Visit Visa)
 */
function getServiceSelectionPrompt(fullName = '') {
    const greeting = fullName ? `Thank you, **${fullName}**! ` : '';
    return {
        stage: 'SERVICE',
        message: `${greeting}Which immigration service are you looking for today? Please select from the options below:`,
        options: [
            { label: '🎓 Study Visa', value: 'STUDY_VISA', action: 'select_service' },
            { label: '💼 Skilled Immigration', value: 'SKILLED_VISA', action: 'select_service' },
            { label: '🏢 Business Visa', value: 'BUSINESS_VISA', action: 'select_service' },
            { label: '✈️ Visit Visa', value: 'VISIT_VISA', action: 'select_service' }
        ],
        actionChips: [
            { label: '🎓 Study Visa', action: 'STUDY_VISA' },
            { label: '💼 Skilled Immigration', action: 'SKILLED_VISA' },
            { label: '🏢 Business Visa', action: 'BUSINESS_VISA' },
            { label: '✈️ Visit Visa', action: 'VISIT_VISA' }
        ]
    };
}

// Backward-compatibility alias
function getInitialServicePrompt() {
    return getServiceSelectionPrompt();
}

/**
 * Get service definition
 */
function getServiceDefinition(serviceType) {
    return IMMIGRATION_SERVICES[serviceType] || IMMIGRATION_SERVICES.STUDY_VISA;
}

/**
 * Get Question at a specific index for a service
 */
function getQuestion(serviceType, index) {
    const service = getServiceDefinition(serviceType);
    return service.questions[index] || null;
}

/**
 * Total question count for a service
 */
function getTotalQuestions(serviceType) {
    const service = getServiceDefinition(serviceType);
    return service.questions.length;
}

/**
 * Safety disclaimer appended to all AI evaluations
 */
const AI_SAFETY_DISCLAIMER = '⚠️ Disclaimer: AI evaluations provide guidance based on official visa criteria and do not guarantee visa grant. Final visa approval rests strictly with government immigration authorities.';

module.exports = {
    IMMIGRATION_SERVICES,
    getWelcomeAndNamePrompt,
    getPhonePrompt,
    getEmailPrompt,
    getServiceSelectionPrompt,
    getInitialServicePrompt,
    getServiceDefinition,
    getQuestion,
    getTotalQuestions,
    AI_SAFETY_DISCLAIMER
};

