/**
 * Indian percentage / CGPA -> German grade scale, via the Modified Bavarian
 * Formula (the standard used by uni-assist and most German universities):
 *   German grade = 1 + 3 * (Nmax - Nd) / (Nmax - Nmin)
 * German scale: 1.0 (best) to 5.0 (fail), 4.0 typically the pass threshold.
 *
 * ESTIMATE ONLY — label this clearly on the page. uni-assist performs the
 * real, legally binding conversion at application time (strategy doc §9).
 */

function convertToGermanGrade(yourGrade, maxGrade, minPassingGrade) {
  if (maxGrade <= minPassingGrade) {
    throw new Error("maxGrade must be greater than minPassingGrade");
  }
  const raw = 1 + 3 * (maxGrade - yourGrade) / (maxGrade - minPassingGrade);
  return Math.round(Math.min(5, Math.max(1, raw)) * 100) / 100;
}

// Convenience wrappers for the two input systems this audience actually uses
function fromIndianPercentage(percentage) {
  // Nmax=100, Nmin=50 (typical Indian university passing mark)
  return convertToGermanGrade(percentage, 100, 50);
}

function fromCGPA(cgpa, scale = 10) {
  // Nmax = scale (usually 10), Nmin = the scale's typical passing CGPA (~5)
  return convertToGermanGrade(cgpa, scale, scale / 2);
}

// Guarded the same way as readiness.js — `module` doesn't exist in a
// plain browser <script> tag.
if (typeof module !== "undefined") module.exports = { convertToGermanGrade, fromIndianPercentage, fromCGPA };
