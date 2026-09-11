/**
 * Recommendation Engine for YojanaSetu Portal
 * Pure rule-based eligibility calculation calibrated against MoSJE, NSFDC & NBCFDC guidelines.
 */

export const SCHEMES = {
  education_loan: {
    id: 'education_loan',
    code: 'NSFDC-EL',
    title: 'Education Loan Scheme (Higher Education)',
    titleHi: 'शिक्षा ऋण योजना (उच्च शिक्षा)',
    agency: 'National Scheduled Castes Finance & Development Corporation (NSFDC)',
    agencyHi: 'राष्ट्रीय अनुसूचित जाति वित्त एवं विकास निगम (MoSJE)',
    interestRate: '3.5% - 4.0%',
    maxAmount: 2000000,
    maxAmountFormatted: '₹20,00,000',
    loanRatio: '90% : 10%',
    description:
      'Concessional education loan for pursuing professional and technical higher education in India and abroad with subsidized interest.',
    descriptionHi:
      'भारत और विदेश में तकनीकी तथा व्यावसायिक उच्च शिक्षा प्राप्त करने हेतु रियायती ब्याज दर पर शिक्षा ऋण।',
    collateralFree: true,
  },
  micro_finance: {
    id: 'micro_finance',
    code: 'NBCFDC-MFS',
    title: 'Micro Finance Scheme (NBCFDC)',
    titleHi: 'सूक्ष्म वित्त योजना (त्वरित एकल खिड़की)',
    agency: 'National Backward Classes Finance & Development Corporation (NBCFDC)',
    agencyHi: 'राष्ट्रीय पिछड़ा वर्ग वित्त एवं विकास निगम (MoSJE)',
    interestRate: '4.0% - 5.0%',
    maxAmount: 140000,
    maxAmountFormatted: '₹1,40,000',
    loanRatio: '95% : 5%',
    description:
      'Accelerated 7-day single-window verification with zero collateral mortgage requirements for micro-ventures up to ₹1.40 Lakh.',
    descriptionHi:
      'छोटे उद्यमों के लिए 7-दिवसीय एकल खिड़की सत्यापन और शून्य बंधक (ज़ीरो कोलैटरल) सुविधा।',
    collateralFree: true,
  },
  term_loan: {
    id: 'term_loan',
    code: 'NSFDC-TL-ME',
    title: 'NSFDC Term Loan Scheme for Micro Enterprises',
    titleHi: 'लघु उद्यम मियादी ऋण योजना (सूक्ष्म उद्यम श्रेणी)',
    agency: 'National Scheduled Castes Finance & Development Corporation (NSFDC / NBCFDC)',
    agencyHi: 'राष्ट्रीय अनुसूचित जाति एवं पिछड़ा वर्ग वित्त विकास निगम (MoSJE)',
    interestRate: '4.0% - 6.0%',
    maxAmount: 500000,
    maxAmountFormatted: '₹5,00,000',
    loanRatio: '90% : 10%',
    description:
      'Concessional term credit providing up to 90% project cost with zero collateral for viable micro enterprises.',
    descriptionHi:
      'व्यवहार्य सूक्ष्म उद्यमों के लिए 90% तक रियायती परियोजना ऋण और शून्य संपार्श्विक आवश्यकता।',
    collateralFree: true,
  },
}

export const PROJECT_TYPES = [
  {
    id: 'Small trade/business',
    label: 'Small trade/business',
    labelHi: 'दुकान / खुदरा व्यापार',
    icon: 'storefront',
    desc: 'Kirana store, retail trading, mobile repair, footwear, vegetable vending',
  },
  {
    id: 'Manufacturing',
    label: 'Manufacturing',
    labelHi: 'विनिर्माण / उत्पादन',
    icon: 'precision_manufacturing',
    desc: 'Small workshop, garment stitching, spice processing, metal fabrication',
  },
  {
    id: 'Service enterprise',
    label: 'Service enterprise',
    labelHi: 'सेवा उद्यम / रिपेयर',
    icon: 'handyman',
    desc: 'Auto servicing, salon, carpentry, electrician clinic, food catering',
  },
  {
    id: 'Higher education',
    label: 'Higher education',
    labelHi: 'उच्च शिक्षा / व्यावसायिक पाठ्यक्रम',
    icon: 'school',
    desc: 'B.Tech, MBBS, MBA, Law, technical diplomas in India or abroad',
  },
]

export const EDUCATION_STATUSES = [
  { value: 'Below 10th', label: 'Below 10th (10वीं से कम)' },
  { value: '10th Pass', label: '10th Pass / Matriculation (10वीं पास)' },
  { value: '12th Pass', label: '12th Pass / Intermediate (12वीं पास)' },
  { value: 'Graduate / Diploma', label: 'Graduate / Diploma (स्नातक / डिप्लोमा)' },
  { value: 'Post Graduate / Professional', label: 'Post Graduate / Professional (स्नातकोत्तर / पेशेवर)' },
]

/**
 * Format string or number to Indian currency representation (e.g. 150000 -> "1,50,000")
 */
export function formatIndianCurrency(value) {
  if (value === null || value === undefined || value === '') return ''
  const clean = String(value).replace(/[^0-9]/g, '')
  if (!clean) return ''
  const num = parseInt(clean, 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('en-IN')
}

/**
 * Convert number to Indian English words representation
 */
export function numberToIndianWords(num) {
  const numeric = typeof num === 'string' ? parseInt(num.replace(/,/g, ''), 10) : Number(num)
  if (!numeric || isNaN(numeric)) return 'Zero Rupees'

  if (numeric === 50000) return 'Fifty Thousand Rupees Only'
  if (numeric === 140000) return 'One Lakh Forty Thousand Rupees Only'
  if (numeric === 150000) return 'One Lakh Fifty Thousand Rupees Only'
  if (numeric === 300000) return 'Three Lakh Rupees Only'
  if (numeric === 500000) return 'Five Lakh Rupees Only'

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ]
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function inWords(n) {
    if ((n = n.toString()).length > 9) return 'Overflow'
    const n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
    if (!n_arr) return ''
    let str = ''
    str += Number(n_arr[1]) !== 0 ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : ''
    str += Number(n_arr[2]) !== 0 ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : ''
    str += Number(n_arr[3]) !== 0 ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : ''
    str += Number(n_arr[4]) !== 0 ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : ''
    str += Number(n_arr[5]) !== 0 ? ((str !== '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) : ''
    return str.trim()
  }

  const words = inWords(numeric)
  return words ? `${words} Rupees Only` : `₹ ${numeric.toLocaleString('en-IN')} approximate allocation`
}

/**
 * Pure recommendation function for YojanaSetu
 *
 * Rules:
 * 1. if projectType is 'Higher education' → 'education_loan'
 * 2. else if monthlyFamilyIncome * 12 > 500000 → return an ineligibility result (annual family income exceeds ₹5 Lakh ceiling)
 * 3. else if projectCost <= 140000 → 'micro_finance'
 * 4. else → 'term_loan'
 *
 * @param {Object} params
 * @param {string} params.projectType
 * @param {number|string} params.projectCost
 * @param {number|string} params.monthlyFamilyIncome
 * @param {string} params.educationStatus
 * @returns {Object} Recommendation result object
 */
export function recommendScheme({
  projectType,
  projectCost,
  monthlyFamilyIncome,
  educationStatus,
}) {
  const cost =
    typeof projectCost === 'string'
      ? parseFloat(projectCost.replace(/,/g, '')) || 0
      : Number(projectCost) || 0

  const monthlyIncome =
    typeof monthlyFamilyIncome === 'string'
      ? parseFloat(monthlyFamilyIncome.replace(/,/g, '')) || 0
      : Number(monthlyFamilyIncome) || 0

  const annualFamilyIncome = monthlyIncome * 12

  // 1. Higher education pathway
  if (projectType === 'Higher education') {
    const details = SCHEMES.education_loan
    return {
      eligible: true,
      scheme: 'education_loan',
      schemeKey: 'education_loan',
      schemeName: details.title,
      schemeNameHi: details.titleHi,
      agency: details.agency,
      agencyHi: details.agencyHi,
      interestRate: details.interestRate,
      maxAmount: details.maxAmount,
      loanRatio: details.loanRatio,
      code: details.code,
      description: details.description,
      descriptionHi: details.descriptionHi,
      collateralFree: details.collateralFree,
      projectType,
      projectCost: cost,
      monthlyFamilyIncome: monthlyIncome,
      annualFamilyIncome,
      educationStatus,
      reason: 'Eligible for Concessional Higher Education Loan Scheme with zero margin up to notified limits.',
      reasonHi: 'अधिसूचित सीमाओं तक शून्य मार्जिन के साथ रियायती उच्च शिक्षा ऋण योजना के लिए पात्र।',
      toString() {
        return 'education_loan'
      },
      valueOf() {
        return 'education_loan'
      },
    }
  }

  // 2. Income ceiling check (Annual family income <= ₹5,00,000)
  if (annualFamilyIncome > 500000) {
    return {
      eligible: false,
      scheme: null,
      schemeKey: 'ineligible',
      error: 'INCOME_CEILING_EXCEEDED',
      reason: 'Annual family income exceeds ₹5 Lakh ceiling',
      reasonHi: 'वार्षिक पारिवारिक आय ₹5 लाख की सीमा से अधिक है',
      message:
        'Your computed annual family income exceeds the statutory ₹5,00,000 ceiling mandated for MoSJE concessional credit.',
      messageHi:
        'आपकी संगणित वार्षिक पारिवारिक आय MoSJE रियायती ऋण के लिए अनिवार्य ₹5,00,000 की सांविधिक सीमा से अधिक है।',
      annualFamilyIncome,
      annualCeiling: 500000,
      monthlyFamilyIncome: monthlyIncome,
      projectCost: cost,
      projectType,
      educationStatus,
      toString() {
        return 'ineligible'
      },
      valueOf() {
        return 'ineligible'
      },
    }
  }

  // 3. Project cost <= ₹1,40,000 → Micro finance
  if (cost <= 140000) {
    const details = SCHEMES.micro_finance
    return {
      eligible: true,
      scheme: 'micro_finance',
      schemeKey: 'micro_finance',
      schemeName: details.title,
      schemeNameHi: details.titleHi,
      agency: details.agency,
      agencyHi: details.agencyHi,
      interestRate: details.interestRate,
      maxAmount: details.maxAmount,
      loanRatio: details.loanRatio,
      code: details.code,
      description: details.description,
      descriptionHi: details.descriptionHi,
      collateralFree: details.collateralFree,
      projectType,
      projectCost: cost,
      monthlyFamilyIncome: monthlyIncome,
      annualFamilyIncome,
      educationStatus,
      reason:
        'Project cost up to ₹1.40 Lakh qualifies for NBCFDC Fast-Track Micro Finance with 7-day turnaround.',
      reasonHi:
        '₹1.40 लाख तक की परियोजना लागत 7-दिवसीय एकल खिड़की सत्यापन के साथ एनबीसीएफडीसी सूक्ष्म वित्त के लिए पात्र है।',
      toString() {
        return 'micro_finance'
      },
      valueOf() {
        return 'micro_finance'
      },
    }
  }

  // 4. Term loan for project cost > ₹1,40,000
  const details = SCHEMES.term_loan
  return {
    eligible: true,
    scheme: 'term_loan',
    schemeKey: 'term_loan',
    schemeName: details.title,
    schemeNameHi: details.titleHi,
    agency: details.agency,
    agencyHi: details.agencyHi,
    interestRate: details.interestRate,
    maxAmount: details.maxAmount,
    loanRatio: details.loanRatio,
    code: details.code,
    description: details.description,
    descriptionHi: details.descriptionHi,
    collateralFree: details.collateralFree,
    projectType,
    projectCost: cost,
    monthlyFamilyIncome: monthlyIncome,
    annualFamilyIncome,
    educationStatus,
    reason:
      'Project cost qualifies for NSFDC Term Loan Scheme providing up to 90% concessional financing.',
    reasonHi:
      'परियोजना लागत 90% तक रियायती ऋण सहायता प्रदान करने वाली एनएसएफडीसी मियादी ऋण योजना के लिए पात्र है।',
    toString() {
      return 'term_loan'
    },
    valueOf() {
      return 'term_loan'
    },
  }
}
