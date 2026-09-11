const { calculateEligibilityScore } = require('./eligibilityService');

const QUESTIONS = [
    {
        stepIndex: 0,
        field: 'countryInterest',
        text: 'Welcome to AI Immigration Assistant & Student CRM! 🎓\n\nWhich country do you want to study in?',
        options: [
            { label: '🇬🇧 United Kingdom', value: 'UK' },
            { label: '🇦🇺 Australia', value: 'Australia' },
            { label: '🇮🇹 Italy', value: 'Italy' },
            { label: '🇩🇪 Germany', value: 'Germany' },
            { label: '🇭🇺 Hungary', value: 'Hungary' }
        ]
    },
    {
        stepIndex: 1,
        field: 'qualification',
        text: 'Great choice! What is your highest academic qualification?',
        options: [
            { label: '🎓 Bachelor\'s Degree', value: 'Bachelor\'s Degree' },
            { label: '🏫 High School / Intermediate', value: 'High School / Intermediate' },
            { label: '📜 Master\'s Degree', value: 'Master\'s Degree' }
        ]
    },
    {
        stepIndex: 2,
        field: 'cgpa',
        text: 'What is your percentage or CGPA in your highest qualification?',
        options: [
            { label: '🌟 3.5+ CGPA (85%+)', value: '3.7 (88%)' },
            { label: '👍 3.0 - 3.4 CGPA (75-84%)', value: '3.2 (78%)' },
            { label: '👌 2.5 - 2.9 CGPA (65-74%)', value: '2.7 (68%)' },
            { label: '📘 Below 2.5 CGPA', value: '2.3 (58%)' }
        ]
    },
    {
        stepIndex: 3,
        field: 'englishTest',
        text: 'Do you have an English Language Proficiency test result?',
        options: [
            { label: '🔤 IELTS (6.5 - 7.5+)', value: 'IELTS' },
            { label: '⚡ PTE (60 - 75+)', value: 'PTE' },
            { label: '🏫 MOI (Medium of Instruction)', value: 'MOI' },
            { label: '⏳ Not Taken Yet', value: 'None' }
        ]
    },
    {
        stepIndex: 4,
        field: 'intake',
        text: 'Which intake are you targeting for your admissions?',
        options: [
            { label: '🍁 Fall 2026 (Sept/Oct)', value: 'Fall 2026' },
            { label: '🌸 Spring 2027 (Jan/Feb)', value: 'Spring 2027' },
            { label: '🍂 Fall 2027', value: 'Fall 2027' }
        ]
    },
    {
        stepIndex: 5,
        field: 'budget',
        text: 'What is your estimated annual tuition budget?',
        options: [
            { label: '💰 $15,000+ / year', value: '$15,000+' },
            { label: '💵 $10,000 - $15,000 / year', value: '$10,000 - $15,000' },
            { label: '💶 Under $10,000 / year', value: 'Under $10,000' }
        ]
    }
];

function getInitialChatState() {
    return {
        stepIndex: 0,
        message: QUESTIONS[0].text,
        options: QUESTIONS[0].options,
        answers: {}
    };
}

function processNextStep(currentStepIndex, selectedAnswer, existingAnswers = {}) {
    const currentQ = QUESTIONS[currentStepIndex];
    const updatedAnswers = { ...existingAnswers };

    if (currentQ) {
        updatedAnswers[currentQ.field] = selectedAnswer;
    }

    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex < QUESTIONS.length) {
        const nextQ = QUESTIONS[nextStepIndex];
        return {
            isComplete: false,
            stepIndex: nextStepIndex,
            message: nextQ.text,
            options: nextQ.options,
            answers: updatedAnswers
        };
    }

    // Step 6 completed: Calculate Score!
    const scoreResult = calculateEligibilityScore({
        qualification: updatedAnswers.qualification,
        cgpa: updatedAnswers.cgpa,
        englishTest: updatedAnswers.englishTest,
        englishScore: '6.5',
        budget: updatedAnswers.budget,
        countryInterest: updatedAnswers.countryInterest
    });

    const completionMessage = `🎉 **AI Assessment Complete!**\n\n` +
        `Target Country: **${updatedAnswers.countryInterest}**\n` +
        `Academic Score: **${scoreResult.academicScore}%**\n` +
        `English Score: **${scoreResult.englishScore}%**\n` +
        `Budget Score: **${scoreResult.budgetScore}%**\n` +
        `----------------------------------------\n` +
        `🏆 **Total Eligibility Score: ${scoreResult.totalScore}%**\n` +
        `Status: **${scoreResult.tier}**\n\n` +
        `Would you like to book a 1-on-1 Consultation with our Senior Immigration Counselor now?`;

    return {
        isComplete: true,
        stepIndex: QUESTIONS.length,
        scoreResult,
        message: completionMessage,
        options: [
            { label: '📅 Book Free Consultation Meeting', value: 'BOOK_MEETING' },
            { label: '🔄 Start Over', value: 'RESTART' }
        ],
        answers: updatedAnswers
    };
}

module.exports = {
    QUESTIONS,
    getInitialChatState,
    processNextStep
};
