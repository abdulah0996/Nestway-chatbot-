/**
 * AI Lead Scoring Service
 * Generates score from 0-100 and classifies into HOT, WARM, COLD tiers
 * Evaluates: profile completeness, financial/budget readiness, timeline urgency, criteria suitability, and intent.
 */

function calculateLeadScore(serviceType, answers = {}) {
    let score = 20; // Baseline for initiating contact
    const reasons = [];
    const breakdown = {
        completeness: 20,
        financial: 0,
        suitability: 0,
        timeline: 0,
        intent: 10
    };

    // 1. Profile Completeness Evaluation
    const answerKeys = Object.keys(answers);
    if (answerKeys.length >= 5) {
        breakdown.completeness = 25;
        reasons.push('Comprehensive profile submitted across all qualification parameters');
    } else if (answerKeys.length >= 3) {
        breakdown.completeness = 15;
    }

    // 2. Service-Specific Evaluation
    switch (serviceType) {
        case 'STUDY_VISA': {
            // Academic Suitability (0 - 30)
            const cgpa = answers.cgpaOrPercentage || answers.cgpa || '';
            if (cgpa.includes('3.5+') || cgpa.includes('3.6') || cgpa.includes('3.7')) {
                breakdown.suitability += 20;
                reasons.push('High academic CGPA (3.5+ / 80%+) qualifies for premier university admissions');
            } else if (cgpa.includes('3.0') || cgpa.includes('3.2')) {
                breakdown.suitability += 15;
                reasons.push('Solid academic standing (3.0+ CGPA)');
            } else {
                breakdown.suitability += 8;
            }

            // English Standing (0 - 20)
            const english = answers.englishTest || '';
            if (english.includes('IELTS') || english.includes('PTE')) {
                breakdown.suitability += 15;
                reasons.push('Standardized English proficiency test on file');
            } else if (english.includes('MOI')) {
                breakdown.suitability += 10;
                reasons.push('Medium of Instruction waiver eligible');
            } else {
                breakdown.suitability += 4;
            }

            // Financial Readiness (0 - 20)
            const budget = answers.budgetRange || answers.budget || '';
            if (budget.includes('High') || budget.includes('$20k') || budget.includes('£15,000+')) {
                breakdown.financial += 20;
                reasons.push('Tuition & living budget fully meets foreign embassy requirements');
            } else if (budget.includes('Medium')) {
                breakdown.financial += 14;
                reasons.push('Moderate budget suitable for public & regional institutions');
            } else {
                breakdown.financial += 8;
                reasons.push('Budget requires partial or merit-based scholarship assistance');
            }

            // Timeline Urgency (0 - 10)
            const intake = answers.targetIntake || answers.intake || '';
            if (intake.includes('2026')) {
                breakdown.timeline += 10;
                reasons.push('Near-term target intake (Fall 2026 / Spring 2027) with active application window');
            } else {
                breakdown.timeline += 5;
            }
            break;
        }

        case 'SKILLED_VISA': {
            // Age Points
            const age = answers.ageBracket || '';
            if (age.includes('25-32')) {
                breakdown.suitability += 15;
                reasons.push('Prime age bracket (25-32) yielding maximum migration point allocation');
            } else if (age.includes('18-24') || age.includes('33-39')) {
                breakdown.suitability += 10;
            } else {
                breakdown.suitability += 5;
            }

            // Work Experience
            const exp = answers.workExperienceYears || '';
            if (exp.includes('5+')) {
                breakdown.suitability += 15;
                reasons.push('Extensive 5+ years verified employment in nominated skilled occupation');
            } else if (exp.includes('3-5')) {
                breakdown.suitability += 10;
            } else {
                breakdown.suitability += 5;
            }

            // English Standing
            const eng = answers.englishProficiency || '';
            if (eng.includes('Superior') || eng.includes('Proficient')) {
                breakdown.financial += 15;
                reasons.push('High English competency (Band 7.0+ / 8.0+) secures vital migration points');
            } else {
                breakdown.financial += 8;
            }

            // Occupation in Demand
            const occ = answers.occupationSector || '';
            if (occ.includes('IT') || occ.includes('Healthcare') || occ.includes('Engineering')) {
                breakdown.timeline += 15;
                reasons.push(`Occupation (${occ}) actively prioritized on national critical skills lists`);
            } else {
                breakdown.timeline += 8;
            }
            break;
        }

        case 'BUSINESS_VISA': {
            // Capital Capacity
            const capital = answers.investmentCapital || '';
            if (capital.includes('$300,000+') || capital.includes('$150,000-$300,000')) {
                breakdown.financial += 30;
                reasons.push('Substantial liquid investment capital satisfies statutory threshold');
            } else if (capital.includes('$75,000')) {
                breakdown.financial += 18;
            } else {
                breakdown.financial += 8;
            }

            // Business Background
            const exp = answers.businessExperience || '';
            if (exp.includes('5+ Years') || exp.includes('Senior Executive')) {
                breakdown.suitability += 20;
                reasons.push('Documented track record in direct business management & ownership');
            } else {
                breakdown.suitability += 10;
            }

            // Timeline Urgency
            const time = answers.targetTimeline || '';
            if (time.includes('1-3 Months') || time.includes('Immediate')) {
                breakdown.timeline += 15;
                reasons.push('Immediate investment timeline ready for commercial deployment');
            } else {
                breakdown.timeline += 8;
            }
            break;
        }

        case 'VISIT_VISA': {
            // Financial Proof
            const fin = answers.financialReadiness || '';
            if (fin.includes('Ready Statement')) {
                breakdown.financial += 25;
                reasons.push('Demonstrated maintaining bank statement ready for verification');
            } else if (fin.includes('Sponsored')) {
                breakdown.financial += 18;
                reasons.push('Formal host family sponsorship declaration available');
            } else {
                breakdown.financial += 8;
            }

            // Travel History
            const hist = answers.travelHistory || '';
            if (hist.includes('Tier 1')) {
                breakdown.suitability += 20;
                reasons.push('Strong established travel history in Tier 1 destinations');
            } else if (hist.includes('Regional')) {
                breakdown.suitability += 12;
            } else {
                breakdown.suitability += 5;
            }

            // Economic Ties
            const emp = answers.employmentStatus || '';
            if (emp.includes('Employed') || emp.includes('Business Owner')) {
                breakdown.timeline += 15;
                reasons.push('Established economic & employment ties in home country ensuring intent to return');
            } else {
                breakdown.timeline += 8;
            }
            break;
        }

        default:
            breakdown.suitability += 15;
            breakdown.financial += 15;
            breakdown.timeline += 10;
            break;
    }

    // Aggregate Score
    const totalScore = Math.min(100, Math.max(25,
        breakdown.completeness +
        breakdown.suitability +
        breakdown.financial +
        breakdown.timeline +
        breakdown.intent
    ));

    // Temperature Tiering
    let temperature = 'WARM';
    if (totalScore >= 85) {
        temperature = 'HOT';
    } else if (totalScore < 50) {
        temperature = 'COLD';
    }

    // AI Confidence & Human Escalation Check
    const requiresEscalation = totalScore < 50 || answerKeys.length < 3;
    const escalationReason = requiresEscalation
        ? 'Profile contains non-standard parameters or marginal criteria; counselor review recommended'
        : null;

    return {
        totalScore,
        temperature,
        scoreReasons: reasons,
        breakdown,
        requiresEscalation,
        escalationReason
    };
}

module.exports = {
    calculateLeadScore
};
