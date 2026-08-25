/**
 * Germany Job Readiness Checker — scoring logic.
 * Weights locked in tech spec §8: Degree 15%, Experience 20%,
 * Technical skills 20%, English 15%, German 15%, Target-role match 15%.
 *
 * Informational career-readiness tool, NOT an immigration/legal eligibility
 * determination — every caller must show that disclaimer alongside the score.
 */

const WEIGHTS = {
  degree: 0.15,
  experience: 0.20,
  technicalSkills: 0.20,
  english: 0.15,
  german: 0.15,
  targetRoleMatch: 0.15,
};

const CEFR_SCORE = { none: 10, A1: 25, A2: 40, B1: 60, B2: 80, C1: 95, C2: 100 };

const DEGREE_SCORE = {
  relevant: 100,     // CS/engineering degree matching the target field
  related: 70,        // adjacent technical field
  unrelated_degree: 40,
  no_degree: 20,
};

function experienceScore(years) {
  if (years >= 10) return 100;
  if (years >= 6) return 90;
  if (years >= 3) return 72;
  if (years >= 1) return 45;
  return 20;
}

/**
 * profile = {
 *   degree: 'relevant' | 'related' | 'unrelated_degree' | 'no_degree',
 *   experienceYears: number,
 *   technicalSkillsMatchPct: 0-100,   // % of the target role's listed skills they have
 *   english: keyof CEFR_SCORE,
 *   german: keyof CEFR_SCORE,
 *   targetRoleMatchPct: 0-100,        // how closely current field matches target track
 * }
 */
function scoreReadiness(profile) {
  const factors = {
    degree: DEGREE_SCORE[profile.degree] ?? 40,
    experience: experienceScore(profile.experienceYears),
    technicalSkills: profile.technicalSkillsMatchPct,
    english: CEFR_SCORE[profile.english] ?? 40,
    german: CEFR_SCORE[profile.german] ?? 10,
    targetRoleMatch: profile.targetRoleMatchPct,
  };

  let weightedSum = 0;
  for (const key in WEIGHTS) {
    weightedSum += factors[key] * WEIGHTS[key];
  }
  const score10 = Math.round((weightedSum / 100) * 10 * 10) / 10; // one decimal

  // Weakest factor = most weighted improvement potential, not just the
  // lowest raw score. Picking by raw score alone meant German (which floors
  // at 10 for anyone who doesn't speak it) dominated the recommendation
  // almost every time, even when 0 years of experience or a 35% role-match
  // were more actionable and more heavily weighted concerns. weight * (100
  // - score) surfaces whichever gap would move the overall score the most.
  const weakest = Object.entries(factors)
    .map(([key, score]) => [key, WEIGHTS[key] * (100 - score)])
    .sort((a, b) => b[1] - a[1])[0][0];
  const nextStep = NEXT_STEP[weakest];

  return {
    score10,
    weakestFactor: weakest,
    nextStep,
    disclaimer: "This is an informational career-readiness tool, not an immigration or legal eligibility determination.",
  };
}

const NEXT_STEP = {
  degree: "Consider how to frame your experience to offset a non-matching degree — projects and certifications carry real weight.",
  experience: "Build depth through personal/open-source projects while applying — experience gaps close faster than they feel.",
  technicalSkills: "Close the specific skill gaps for your target role — see the Skills page for a track-by-track breakdown.",
  english: "Target explicitly English-speaking roles while improving further — many German tech employers hire on English alone.",
  german: "Start B1 preparation now; it compounds — even conversational German meaningfully widens which roles are realistic.",
  targetRoleMatch: "Consider roles closer to your current track, or be explicit in your CV about transferable experience.",
};

// CommonJS export for the Node-based Phase 0 validation script only —
// `module` doesn't exist in a plain browser <script> tag, so this must be
// guarded or it throws a ReferenceError the moment the page loads.
if (typeof module !== "undefined") module.exports = { scoreReadiness };
