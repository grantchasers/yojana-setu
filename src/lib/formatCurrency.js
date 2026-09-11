/**
 * Utility helper to format a currency amount with the Indian Rupee symbol (₹)
 * and Indian digit grouping (e.g. ₹1,40,000 not 140,000).
 *
 * @param {number|string} amount - The currency value to format.
 * @param {Object} [options] - Optional formatting options.
 * @param {number} [options.maximumFractionDigits=0] - Maximum fraction digits.
 * @param {number} [options.minimumFractionDigits=0] - Minimum fraction digits.
 * @returns {string} Formatted string like "₹1,40,000"
 */
export function formatCurrency(amount, options = {}) {
  if (amount === null || amount === undefined || amount === '') return ''
  const num =
    typeof amount === 'string'
      ? parseFloat(amount.replace(/[^0-9.-]/g, ''))
      : Number(amount)
  if (isNaN(num)) return ''

  const { maximumFractionDigits = 0, minimumFractionDigits = 0 } = options

  return `₹${num.toLocaleString('en-IN', {
    maximumFractionDigits,
    minimumFractionDigits,
  })}`
}

export const formatRupees = formatCurrency
export default formatCurrency
