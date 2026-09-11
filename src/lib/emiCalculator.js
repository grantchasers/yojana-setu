import { formatCurrency } from './formatCurrency'

/**
 * EMI & Financial Amortization Calculation Library for YojanaSetu
 * Uses the standard reducing-balance Equated Monthly Installment (EMI) formula.
 */

/**
 * Pure function to calculate monthly EMI using standard reducing balance formula:
 * EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
 *
 * @param {Object} params
 * @param {number|string} params.principal - Principal loan amount (P)
 * @param {number|string} params.annualRatePct - Annual interest rate percentage (e.g. 5.0 for 5%)
 * @param {number|string} params.tenureMonths - Repayment duration in months (n)
 * @returns {number} Monthly EMI amount (unrounded float)
 */
export function calculateEMI({ principal, annualRatePct, tenureMonths }) {
  const cleanPrincipal =
    typeof principal === 'string'
      ? parseFloat(principal.replace(/,/g, '')) || 0
      : Number(principal) || 0

  const cleanRate = Number(annualRatePct) || 0
  const n = Math.round(Number(tenureMonths)) || 0

  if (cleanPrincipal <= 0 || n <= 0) {
    return 0
  }

  // Monthly interest rate r = (annualRate / 12) / 100
  const r = cleanRate / 12 / 100

  // If 0% interest rate, EMI is simple division of principal by months
  if (r <= 0) {
    return cleanPrincipal / n
  }

  // Factor: (1 + r)^n
  const factor = Math.pow(1 + r, n)

  // Guard against extreme factor overflow / division by zero
  if (!isFinite(factor) || factor - 1 === 0) {
    return cleanPrincipal / n
  }

  const emi = (cleanPrincipal * r * factor) / (factor - 1)
  return emi
}

/**
 * Pure function to build full amortization summary
 * Computes monthly EMI, total interest, total payable, and yearly repayment schedule.
 *
 * @param {Object} params
 * @param {number|string} params.principal - Principal loan amount
 * @param {number|string} params.annualRatePct - Annual interest rate in percent
 * @param {number|string} params.tenureMonths - Tenure in months
 * @returns {Object} Amortization summary containing totalInterest, totalPayable, etc.
 */
export function buildAmortizationSummary({ principal, annualRatePct, tenureMonths }) {
  const P =
    typeof principal === 'string'
      ? parseFloat(principal.replace(/,/g, '')) || 0
      : Number(principal) || 0

  const rate = Number(annualRatePct) || 0
  const n = Math.max(1, Math.round(Number(tenureMonths)) || 1)

  const emi = calculateEMI({ principal: P, annualRatePct: rate, tenureMonths: n })
  const totalPayable = emi * n
  const totalInterest = Math.max(0, totalPayable - P)

  // Calculate percentage splits
  const principalRatio = totalPayable > 0 ? Math.min(100, Math.max(0, Math.round((P / totalPayable) * 100))) : 100
  const interestRatio = 100 - principalRatio

  // Generate annual schedule preview
  const years = Math.max(1, Math.ceil(n / 12))
  const yearlySchedule = []
  const annualAmount = emi * 12

  for (let y = 1; y <= years; y++) {
    const isFinal = y === years
    const monthsInThisYear = isFinal && n % 12 !== 0 ? n % 12 : 12
    const amount = isFinal
      ? Math.max(0, totalPayable - annualAmount * (years - 1))
      : annualAmount

    yearlySchedule.push({
      year: y,
      amount,
      months: monthsInThisYear,
      isFinal,
    })
  }

  return {
    principal: P,
    annualRatePct: rate,
    tenureMonths: n,
    monthlyEMI: emi,
    totalInterest,
    totalPayable,
    principalRatio,
    interestRatio,
    yearlySchedule,
  }
}

/**
 * Utility helper to format a currency value in Indian numbering format
 * @param {number|string} amount
 * @returns {string} e.g. "₹1,35,000"
 */
export function formatRupees(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : Number(amount) || 0
  return formatCurrency(Math.round(num))
}

