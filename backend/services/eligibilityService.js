/**
 * Eligibility Calculation Service
 * Evaluates academic CGPA, English proficiency, and budget to compute eligibility score.
 */

function calculateEligibilityScore({ qualification, cgpa, englishTest, englishScore, budget, countryInterest }) {
    let academicScore = 70;
    let englishScoreVal = 60;
    let budgetScore = 70;

    // Academic Score Calculation
    if (cgpa) {
        const numCgpa = parseFloat(cgpa);
        if (!isNaN(numCgpa)) {
            if (numCgpa >= 3.7) academicScore = 95;
            else if (numCgpa >= 3.3) academicScore = 88;
            else if (numCgpa >= 3.0) academicScore = 80;
            else if (numCgpa >= 2.5) academicScore = 70;
            else academicScore = 60;
        } else {
            const numPct = parseFloat(cgpa.replace('%', ''));
            if (!isNaN(numPct)) {
                if (numPct >= 85) academicScore = 95;
                else if (numPct >= 75) academicScore = 85;
                else if (numPct >= 65) academicScore = 75;
                else academicScore = 65;
            }
        }
    }

    // English Score Calculation
    if (englishTest === 'IELTS') {
        const numScore = parseFloat(englishScore);
        if (!isNaN(numScore)) {
            if (numScore >= 7.5) englishScoreVal = 98;
            else if (numScore >= 7.0) englishScoreVal = 92;
            else if (numScore >= 6.5) englishScoreVal = 85;
            else if (numScore >= 6.0) englishScoreVal = 75;
            else englishScoreVal = 65;
        } else {
            englishScoreVal = 85;
        }
    } else if (englishTest === 'PTE') {
        const numScore = parseFloat(englishScore);
        if (!isNaN(numScore)) {
            if (numScore >= 70) englishScoreVal = 95;
            else if (numScore >= 62) englishScoreVal = 88;
            else englishScoreVal = 75;
        } else {
            englishScoreVal = 85;
        }
    } else if (englishTest === 'MOI') {
        englishScoreVal = 80; // Medium of Instruction accepted in select UK/Italy universities
    } else if (englishTest === 'Duolingo') {
        englishScoreVal = 82;
    } else {
        englishScoreVal = 60;
    }

    // Budget Score Calculation
    if (budget && (budget.includes('20,000') || budget.includes('High') || budget.includes('Above'))) {
        budgetScore = 95;
    } else if (budget && (budget.includes('15,000') || budget.includes('10,000') || budget.includes('Medium'))) {
        budgetScore = 85;
    } else if (budget && (budget.includes('5,000') || budget.includes('Low'))) {
        budgetScore = 70;
    } else {
        budgetScore = 80;
    }

    // Overall Weighted Average: 45% Academic, 30% English, 25% Budget
    const totalScore = Math.round((academicScore * 0.45) + (englishScoreVal * 0.30) + (budgetScore * 0.25));

    let tier = 'High Eligibility';
    if (totalScore < 70) tier = 'Moderate Eligibility - Foundation Needed';
    else if (totalScore < 82) tier = 'Good Eligibility - Top State Universities';
    else tier = 'Excellent Eligibility - Premium Universities & Scholarships';

    return {
        academicScore,
        englishScore: englishScoreVal,
        budgetScore,
        totalScore,
        tier
    };
}

module.exports = { calculateEligibilityScore };
