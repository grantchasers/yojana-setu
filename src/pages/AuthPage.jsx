import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function AuthPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Two modes: 'signIn' or 'signUp'
  const [mode, setMode] = useState('signIn')

  // Form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  // Status states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [infoMessage, setInfoMessage] = useState(null)
  const [alternateIdNotice, setAlternateIdNotice] = useState(null)

  // Validation helpers
  const isValidEmail = (val) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(String(val || '').trim())
  const isValidPhone = (val) => /^\d{10}$/.test(String(val || '').trim())

  const isEmailValid = isValidEmail(email)
  const isPhoneValid = mode === 'signIn' || isValidPhone(phone)
  const isPasswordValid = password.length >= 6
  const isNameValid = mode === 'signIn' || name.trim().length > 0
  const isConsentValid = mode === 'signIn' || consent

  const isFormValid = isEmailValid && isPhoneValid && isPasswordValid && isNameValid && isConsentValid

  const getMissingFieldText = () => {
    const isHindi = i18n.language?.startsWith('hi')
    const missing = []
    if (mode === 'signUp') {
      if (!isNameValid) missing.push(isHindi ? 'पूरा नाम' : 'full name')
      if (!isPhoneValid) {
        missing.push(
          isHindi
            ? `10 अंकों का मोबाइल नंबर (${phone.length}/10)`
            : `10-digit mobile (${phone.length}/10)`
        )
      }
      if (!isEmailValid) missing.push(isHindi ? 'मान्य ईमेल' : 'valid email')
      if (!isPasswordValid) {
        missing.push(
          isHindi
            ? `पासवर्ड (कम से कम 6 अक्षर)`
            : `password (min. 6 chars)`
        )
      }
      if (!isConsentValid) missing.push(isHindi ? 'डीपीडीपी सहमति' : 'DPDP consent')
    } else {
      if (!isEmailValid) missing.push(isHindi ? 'मान्य ईमेल पता' : 'valid email')
      if (!isPasswordValid) {
        missing.push(
          isHindi
            ? `पासवर्ड (कम से कम 6 अक्षर)`
            : `password (min. 6 chars)`
        )
      }
    }

    if (missing.length === 0) return null
    return isHindi
      ? `आवश्यक जानकारी अधूरी है: ${missing.join(', ')}`
      : `Missing required fields: ${missing.join(', ')}`
  }

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  // Map Supabase error messages to friendly strings
  const mapSupabaseError = (err) => {
    if (!err) return null
    const rawMessage = typeof err === 'string' ? err : err.message || ''
    const isHindi = i18n.language?.startsWith('hi')

    if (rawMessage.includes('Invalid login credentials')) {
      return isHindi
        ? 'अमान्य ईमेल या पासवर्ड। कृपया अपनी जानकारी जांचें और पुनः प्रयास करें।'
        : 'Invalid email or password. Please verify your credentials and try again.'
    }
    if (
      rawMessage.includes('User already registered') ||
      rawMessage.includes('already exists')
    ) {
      return isHindi
        ? 'इस ईमेल के साथ खाता पहले से मौजूद है। कृपया साइन इन करें।'
        : 'An account with this email already exists. Please sign in instead.'
    }
    if (
      rawMessage.includes('Password should be at least 6 characters') ||
      rawMessage.includes('password is too short')
    ) {
      return isHindi
        ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
        : 'Password must be at least 6 characters long.'
    }
    if (rawMessage.includes('Email not confirmed')) {
      return isHindi
        ? 'कृपया पहले अपने ईमेल पते की पुष्टि करें।'
        : 'Please confirm your email address before signing in.'
    }
    if (
      rawMessage.includes('rate limit') ||
      rawMessage.includes('over_email_send_rate_limit') ||
      rawMessage.includes('security purposes')
    ) {
      return isHindi
        ? 'बहुत अधिक प्रयास किए गए। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
        : 'Too many attempts. Please wait a few minutes before trying again.'
    }
    if (
      rawMessage.includes('Failed to fetch') ||
      rawMessage.includes('Network')
    ) {
      return isHindi
        ? 'सर्वर से कनेक्ट करने में विफल। कृपया अपना इंटरनेट कनेक्शन जांचें।'
        : 'Network connection issue. Please check your internet connection and try again.'
    }
    if (rawMessage.includes('Signup requires a valid password')) {
      return isHindi
        ? 'कृपया एक वैध पासवर्ड दर्ज करें।'
        : 'Please enter a valid password.'
    }

    return (
      rawMessage ||
      (isHindi
        ? 'प्रमाणीकरण में त्रुटि हुई। कृपया पुनः प्रयास करें।'
        : 'Authentication error. Please try again.')
    )
  }

  const handleModeChange = (newMode) => {
    setMode(newMode)
    setError(null)
    setInfoMessage(null)
    setAlternateIdNotice(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isFormValid || loading) return
    setError(null)
    setInfoMessage(null)
    setAlternateIdNotice(null)
    setLoading(true)

    try {
      if (mode === 'signIn') {
        if (!isEmailValid) {
          setError(
            i18n.language?.startsWith('hi')
              ? 'कृपया एक वैध ईमेल पता दर्ज करें।'
              : 'Please enter a valid email address.'
          )
          setLoading(false)
          return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signInError) {
          setError(mapSupabaseError(signInError))
        } else {
          navigate('/', { replace: true })
        }
      } else {
        // Sign Up Mode
        if (!name.trim()) {
          setError(
            i18n.language?.startsWith('hi')
              ? 'कृपया अपना पूरा नाम दर्ज करें।'
              : 'Please enter your full name.'
          )
          setLoading(false)
          return
        }

        if (!isValidPhone(phone)) {
          setError(
            i18n.language?.startsWith('hi')
              ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
              : 'Please enter a valid 10-digit mobile number.'
          )
          setLoading(false)
          return
        }

        if (!isEmailValid) {
          setError(
            i18n.language?.startsWith('hi')
              ? 'कृपया एक वैध ईमेल पता दर्ज करें।'
              : 'Please enter a valid email address.'
          )
          setLoading(false)
          return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim(),
              full_name: name.trim(),
              phone: phone.trim(),
            },
          },
        })

        if (signUpError) {
          setError(mapSupabaseError(signUpError))
        } else if (data?.session) {
          // Direct login
          navigate('/', { replace: true })
        } else {
          // Email confirmation or pending verification
          setInfoMessage(
            i18n.language?.startsWith('hi')
              ? 'खाता सफलतापूर्वक बनाया गया! यदि आवश्यक हो तो कृपया अपने ईमेल की पुष्टि करें या साइन इन करें।'
              : 'Account created successfully! Please check your email to verify your account, or sign in.'
          )
          setMode('signIn')
        }
      }
    } catch (err) {
      setError(mapSupabaseError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-gutter-md">
      {/* Standalone Language Switcher */}
      <div className="w-full max-w-md flex justify-end mb-3">
        <div className="inline-flex items-center bg-surface-container rounded-full p-1 border border-outline-variant/40 shadow-xs">
          <button
            type="button"
            onClick={() => i18n.changeLanguage('en')}
            className={`px-3 py-1 text-label-sm font-label-sm rounded-full transition-all duration-200 ${
              i18n.language?.startsWith('en')
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            aria-label="English"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => i18n.changeLanguage('hi')}
            className={`px-3 py-1 text-label-sm font-label-sm rounded-full transition-all duration-200 ${
              i18n.language?.startsWith('hi')
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            aria-label="Hindi"
          >
            हिंदी
          </button>
        </div>
      </div>

      <main className="w-full max-w-md bg-surface-container-lowest rounded-xl p-6 sm:p-margin-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] text-left">
        <div className="flex flex-col w-full">
          {/* Official Bureaucratic Header Indicator */}
          <div className="flex flex-col items-center text-center mb-space-lg">
            {/* Emblem & Security Badging */}
            <div className="inline-flex items-center gap-space-xs px-space-md py-space-xs bg-surface-container rounded-full mb-space-sm">
              <svg
                className="w-3.5 h-3.5 text-tertiary-container"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Govt. of India Secure Gateway • भारत सरकार सुरक्षित पोर्टल
              </span>
            </div>

            {/* National Emblem Graphic Placeholder / Icon Anchor */}
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center mb-space-xs shadow-sm">
              <svg
                className="w-7 h-7"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  fill="none"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="12" fill="currentColor" r="2.5" />
                <path
                  d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.2"
                />
              </svg>
            </div>

            <h1 className="font-title-lg text-title-lg text-primary tracking-tight">
              YojanaSetu • योजनासेतु
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              National Welfare &amp; Credit Empowerment Portal
            </p>
            <div className="inline-block mt-space-xs bg-surface-container-high text-primary px-space-sm py-0.5 rounded text-label-sm font-label-sm">
              Role: Applicant / आवेदक
            </div>
          </div>

          {/* Mode Segmented Switch */}
          <div
            className="grid grid-cols-2 p-1 bg-surface-container rounded-lg mb-space-lg text-center select-none"
            id="authModeSwitch"
          >
            <button
              id="tabLogin"
              type="button"
              onClick={() => handleModeChange('signIn')}
              className={`py-2 rounded font-title-sm text-title-sm transition-all duration-200 ${
                mode === 'signIn'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t('auth.signIn')}
            </button>
            <button
              id="tabRegister"
              type="button"
              onClick={() => handleModeChange('signUp')}
              className={`py-2 rounded font-title-sm text-title-sm transition-all duration-200 ${
                mode === 'signUp'
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t('auth.signUp')}
            </button>
          </div>

          {/* Error Message Display */}
          {error && (
            <div
              className="mb-space-md p-space-sm bg-error-container text-on-error-container rounded-lg flex items-start gap-space-sm border border-error/20"
              role="alert"
            >
              <svg
                className="w-4 h-4 text-error mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span className="font-body-sm text-body-sm leading-tight">
                {error}
              </span>
            </div>
          )}

          {/* Info / Success Message Display */}
          {infoMessage && (
            <div
              className="mb-space-md p-space-sm bg-surface-container text-primary rounded-lg flex items-start gap-space-sm border border-primary/20"
              role="status"
            >
              <svg
                className="w-4 h-4 text-tertiary-container mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              <span className="font-body-sm text-body-sm leading-tight">
                {infoMessage}
              </span>
            </div>
          )}

          {/* Main Interaction Form */}
          <form className="flex flex-col gap-space-md" onSubmit={handleSubmit}>
            {/* Context Banner */}
            <div
              className="bg-surface-container-low p-space-sm rounded-lg flex items-start gap-space-sm"
              id="modeHelperBox"
            >
              <svg
                className="w-4 h-4 text-primary-container mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <div className="flex flex-col">
                <span
                  className="font-label-md text-label-md text-primary font-bold"
                  id="helperHeading"
                >
                  {mode === 'signIn'
                    ? 'Applicant Direct Sign-In / आवेदक लॉगिन'
                    : 'New Beneficiary Registration / नया पंजीकरण'}
                </span>
                <span
                  className="font-body-sm text-body-sm text-on-surface-variant"
                  id="helperSubtext"
                >
                  {mode === 'signIn'
                    ? 'Enter your registered email and password to access your applicant dashboard.'
                    : 'Register with your name, mobile, and email to check eligibility across 45+ Central & State micro-credit schemes.'}
                </span>
              </div>
            </div>

            {/* Sign Up Field: Name */}
            {mode === 'signUp' && (
              <div className="flex flex-col gap-space-xs">
                <label
                  className="font-title-sm text-title-sm text-on-surface"
                  htmlFor="nameInput"
                >
                  Full Name <span className="text-on-surface-variant font-normal">/ पूरा नाम</span>
                </label>
                <div className="flex items-center bg-surface-container-high focus-within:bg-surface-container-highest rounded-lg shadow-sm overflow-hidden transition-colors">
                  <input
                    className="w-full h-12 px-space-md bg-transparent text-primary font-title-md text-title-md placeholder:text-outline focus:outline-none"
                    id="nameInput"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ramesh Kumar / रमेश कुमार"
                    autoComplete="name"
                  />
                  {name.trim().length > 0 && (
                    <span className="material-symbols-outlined text-tertiary pr-3 text-lg select-none" title="Name entered">
                      check_circle
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Sign Up Field: Phone with Country Code & Tricolor Accent */}
            {mode === 'signUp' && (
              <div className="flex flex-col gap-space-xs">
                <div className="flex justify-between items-baseline">
                  <label
                    className="font-title-sm text-title-sm text-on-surface"
                    htmlFor="mobileInput"
                  >
                    Mobile Number <span className="text-on-surface-variant font-normal">/ मोबाइल नंबर</span>
                  </label>
                  <span className="font-label-sm text-label-sm text-tertiary-container font-semibold">
                    DPDP Protected
                  </span>
                </div>
                {/* Country Code & Numeric Input Field */}
                <div
                  className={`flex items-center bg-surface-container-high focus-within:bg-surface-container-highest rounded-lg shadow-sm overflow-hidden transition-colors border ${
                    phone.length > 0 && phone.length < 10
                      ? 'border-error/60 ring-1 ring-error/30'
                      : phone.length === 10
                        ? 'border-tertiary/60 ring-1 ring-tertiary/30'
                        : 'border-transparent'
                  }`}
                >
                  {/* Integrated Prefix with Indian Tricolor Accent */}
                  <div className="flex items-center gap-space-xs px-space-md py-3 bg-surface-container text-on-surface select-none shrink-0">
                    <span className="inline-flex flex-col w-4 h-3 justify-between shadow-xs overflow-hidden rounded-[1px]">
                      <span className="h-1 bg-[#FF9933] w-full block" />
                      <span className="h-1 bg-[#FFFFFF] w-full block relative flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-[#000088] block" />
                      </span>
                      <span className="h-1 bg-[#138808] w-full block" />
                    </span>
                    <span className="font-title-sm text-title-sm font-semibold tracking-wide">
                      +91
                    </span>
                  </div>
                  <input
                    className="w-full h-12 px-space-md bg-transparent text-primary font-title-md text-title-md tracking-wider placeholder:text-outline focus:outline-none"
                    id="mobileInput"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    autoComplete="tel"
                  />
                  {phone.length === 10 && (
                    <span className="material-symbols-outlined text-tertiary pr-3 text-lg select-none" title="10-digit phone valid">
                      check_circle
                    </span>
                  )}
                </div>
                {phone.length > 0 && phone.length < 10 ? (
                  <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-sm shrink-0">error</span>
                    <span>
                      {i18n.language?.startsWith('hi')
                        ? `मोबाइल नंबर ठीक 10 अंकों का होना चाहिए (${phone.length}/10 दर्ज)`
                        : `Mobile number must be exactly 10 digits (${phone.length}/10 entered)`}
                    </span>
                  </p>
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Used for direct scheme credit updates and e-KYC status tracking.
                  </p>
                )}
              </div>
            )}

            {/* Email Field (Both Modes) */}
            <div className="flex flex-col gap-space-xs">
              <label
                className="font-title-sm text-title-sm text-on-surface"
                htmlFor="emailInput"
              >
                Email Address <span className="text-on-surface-variant font-normal">/ ईमेल</span>
              </label>
              <div
                className={`flex items-center bg-surface-container-high focus-within:bg-surface-container-highest rounded-lg shadow-sm overflow-hidden transition-colors border ${
                  email.length > 0 && !isEmailValid
                    ? 'border-error/60 ring-1 ring-error/30'
                    : email.length > 0 && isEmailValid
                      ? 'border-tertiary/60 ring-1 ring-tertiary/30'
                      : 'border-transparent'
                }`}
              >
                <input
                  className="w-full h-12 px-space-md bg-transparent text-primary font-title-md text-title-md placeholder:text-outline focus:outline-none"
                  id="emailInput"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
                {email.length > 0 && isEmailValid && (
                  <span className="material-symbols-outlined text-tertiary pr-3 text-lg select-none" title="Valid email format">
                    check_circle
                  </span>
                )}
              </div>
              {email.length > 0 && !isEmailValid && (
                <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>
                    {i18n.language?.startsWith('hi')
                      ? 'कृपया एक वैध ईमेल पता दर्ज करें (उदा. name@example.com)'
                      : 'Please enter a valid email format (e.g. name@example.com)'}
                  </span>
                </p>
              )}
            </div>

            {/* Password Field (Both Modes) */}
            <div className="flex flex-col gap-space-xs">
              <div className="flex justify-between items-baseline">
                <label
                  className="font-title-sm text-title-sm text-on-surface"
                  htmlFor="passwordInput"
                >
                  Password <span className="text-on-surface-variant font-normal">/ पासवर्ड</span>
                </label>
                {mode === 'signUp' && (
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Min. 6 characters
                  </span>
                )}
              </div>
              <div
                className={`flex items-center bg-surface-container-high focus-within:bg-surface-container-highest rounded-lg shadow-sm overflow-hidden transition-colors border ${
                  password.length > 0 && password.length < 6
                    ? 'border-error/60 ring-1 ring-error/30'
                    : 'border-transparent'
                }`}
              >
                <input
                  className="w-full h-12 px-space-md bg-transparent text-primary font-title-md text-title-md placeholder:text-outline focus:outline-none"
                  id="passwordInput"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-space-md py-3 text-on-surface-variant hover:text-on-surface transition-all duration-200 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="font-label-sm text-label-sm text-error flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>
                    {i18n.language?.startsWith('hi')
                      ? `पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (${password.length}/6 दर्ज)`
                      : `Password must be at least 6 characters (${password.length}/6 entered)`}
                  </span>
                </p>
              )}
            </div>

            {/* Quick Alternate Identity Strip */}
            <div className="bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <svg
                  className="w-4 h-4 text-tertiary-container shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM8 7h8v2H8zm0 4h8v2H8zm0 4h5v2H8z" />
                </svg>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Aadhaar / MeriPehchaan linked?
                </span>
              </div>
              <button
                className="font-label-md text-label-md text-primary font-bold underline hover:opacity-80 transition-all duration-200"
                onClick={() =>
                  setAlternateIdNotice(
                    'Direct MeriPehchaan National SSO integration is enabled. Enter your registered email to continue.'
                  )
                }
                type="button"
              >
                Direct e-Pehchaan
              </button>
            </div>

            {alternateIdNotice && (
              <div className="p-space-xs px-space-sm bg-surface-container rounded text-label-sm font-label-sm text-on-surface-variant">
                {alternateIdNotice}
              </div>
            )}

            {/* DPDP Statutory Consent Box (Sign Up only) */}
            {mode === 'signUp' && (
              <div className="p-space-sm bg-surface-container-low rounded-lg flex items-start gap-space-sm mt-space-xs">
                <div className="min-w-[36px] flex items-center justify-center pt-0.5">
                  <input
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface text-primary-container focus:ring-0 cursor-pointer transition-all duration-200"
                    id="dpdpConsent"
                    required
                    type="checkbox"
                  />
                </div>
                <label
                  className="font-body-sm text-body-sm text-on-surface select-none cursor-pointer leading-tight"
                  htmlFor="dpdpConsent"
                >
                  I agree to provide my credentials for MoSJE scheme assistance. My
                  data is protected under the{' '}
                  <strong>Digital Personal Data Protection (DPDP) Act</strong>.
                </label>
              </div>
            )}

            {/* Primary Action CTA (Saffron Restrained Civic Accent) with Visible Disabled State */}
            <button
              className={`w-full min-h-[48px] font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-space-xs transition-all duration-200 mt-space-xs ${
                !isFormValid || loading
                  ? 'bg-surface-container-high text-outline opacity-60 cursor-not-allowed border border-outline-variant/40 shadow-none'
                  : 'bg-secondary-container hover:bg-secondary text-on-primary shadow-md cursor-pointer'
              }`}
              id="submitButton"
              type="submit"
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  <div
                    className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"
                    role="status"
                    aria-label="Loading"
                  />
                  <span>{t('common.loading', 'Loading...')}</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                  <span>
                    {mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
                  </span>
                </>
              )}
            </button>

            {/* Small helper-text line explaining what is missing when disabled */}
            {!isFormValid && (
              <div
                className="flex items-center justify-center gap-1 text-center mt-1 px-1 text-error"
                id="submitDisabledHelperText"
                role="status"
              >
                <span className="material-symbols-outlined text-sm shrink-0">info</span>
                <span className="font-label-sm text-label-sm leading-tight">
                  {getMissingFieldText()}
                </span>
              </div>
            )}
          </form>

          {/* Civic Assistance & Facilitation Section */}
          <div className="mt-space-lg pt-space-md bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-sm">
            <div className="flex items-center gap-space-xs text-primary">
              <svg
                className="w-4 h-4 text-primary shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
              </svg>
              <span className="font-title-sm text-title-sm font-bold">
                Need Help / सहायता चाहिए?
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Having trouble? You can also authenticate using{' '}
              <strong>Jan Samarth / MeriPehchaan</strong> or visit your nearest
              Gram Panchayat <strong>Common Service Centre (CSC)</strong> for
              assisted biometrics.
            </p>
            {/* Assisted Service Hub Locations Badge */}
            <div className="flex items-center justify-between pt-space-xs text-primary">
              <span className="font-label-sm text-label-sm font-semibold flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-secondary shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                3.8 Lakh+ CSCs Active
              </span>
              <span className="font-label-md text-label-md text-primary font-medium">
                Gram Panchayat CSCs
              </span>
            </div>
          </div>

          {/* Trust Badges Strip */}
          <div className="mt-space-md grid grid-cols-3 gap-space-xs text-center">
            <div className="p-space-xs bg-surface-container rounded flex flex-col items-center">
              <span className="font-label-sm text-label-sm text-on-surface font-bold">
                Zero Spam
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant scale-90">
                Govt. Updates Only
              </span>
            </div>
            <div className="p-space-xs bg-surface-container rounded flex flex-col items-center">
              <span className="font-label-sm text-label-sm text-tertiary-container font-bold">
                256-bit SSL
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant scale-90">
                NIC Certified
              </span>
            </div>
            <div className="p-space-xs bg-surface-container rounded flex flex-col items-center">
              <span className="font-label-sm text-label-sm text-on-surface font-bold">
                DPDP Ready
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant scale-90">
                Strict Data Privacy
              </span>
            </div>
          </div>

          {/* Secondary Role Switch Link */}
          <div className="mt-space-lg text-center pt-space-xs">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Channel Partner, Inspector, or Bank Officer?
            </span>
            <div className="mt-0.5">
              <button
                type="button"
                onClick={() => {
                  handleModeChange('signIn')
                  setEmail('admin@yojanasetu.gov.in')
                }}
                className="font-label-md text-label-md text-primary font-bold underline hover:opacity-80 transition-all duration-200"
              >
                Click here for Staff &amp; Official Portal Login
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
