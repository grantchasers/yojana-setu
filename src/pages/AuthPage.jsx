import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Cpu,
  MapPin,
  Radio,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import LedIndicator from "../components/ui/LedIndicator";

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, enterDemoMode } = useAuth();

  // Two modes: 'signIn' or 'signUp'
  const [mode, setMode] = useState("signIn");

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [alternateIdNotice, setAlternateIdNotice] = useState(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Validation helpers
  const isValidEmail = (val) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
      String(val || "").trim(),
    );
  const isValidPhone = (val) => /^\d{10}$/.test(String(val || "").trim());

  const isEmailValid = isValidEmail(email);
  const isPhoneValid = mode === "signIn" || isValidPhone(phone);
  const isPasswordValid = password.length >= 6;
  const isNameValid = mode === "signIn" || name.trim().length > 0;
  const isConsentValid = mode === "signIn" || consent;

  const isFormValid =
    isEmailValid &&
    isPhoneValid &&
    isPasswordValid &&
    isNameValid &&
    isConsentValid;

  const getMissingFieldText = () => {
    const isHindi = i18n.language?.startsWith("hi");
    const missing = [];
    if (mode === "signUp") {
      if (!isNameValid) missing.push(isHindi ? "पूरा नाम" : "full name");
      if (!isPhoneValid) {
        missing.push(
          isHindi
            ? `10 अंकों का मोबाइल नंबर (${phone.length}/10)`
            : `10-digit mobile (${phone.length}/10)`,
        );
      }
      if (!isEmailValid) missing.push(isHindi ? "मान्य ईमेल" : "valid email");
      if (!isPasswordValid) {
        missing.push(
          isHindi ? `पासवर्ड (कम से कम 6 अक्षर)` : `password (min. 6 chars)`,
        );
      }
      if (!isConsentValid)
        missing.push(isHindi ? "डीपीडीपी सहमति" : "DPDP consent");
    } else {
      if (!isEmailValid)
        missing.push(isHindi ? "मान्य ईमेल पता" : "valid email");
      if (!isPasswordValid) {
        missing.push(
          isHindi ? `पासवर्ड (कम से कम 6 अक्षर)` : `password (min. 6 chars)`,
        );
      }
    }

    if (missing.length === 0) return null;
    return isHindi
      ? `आवश्यक जानकारी अधूरी है: ${missing.join(", ")}`
      : `Missing required fields: ${missing.join(", ")}`;
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Map Supabase error messages to friendly strings
  const mapSupabaseError = (err) => {
    if (!err) return null;
    const rawMessage = typeof err === "string" ? err : err.message || "";
    const isHindi = i18n.language?.startsWith("hi");

    if (rawMessage.includes("Invalid login credentials")) {
      return isHindi
        ? "अमान्य ईमेल या पासवर्ड। कृपया अपनी जानकारी जांचें और पुनः प्रयास करें।"
        : "Invalid email or password. Please verify your credentials and try again.";
    }
    if (
      rawMessage.includes("User already registered") ||
      rawMessage.includes("already exists")
    ) {
      return isHindi
        ? "इस ईमेल के साथ खाता पहले से मौजूद है। कृपया साइन इन करें।"
        : "An account with this email already exists. Please sign in instead.";
    }
    if (
      rawMessage.includes("Password should be at least 6 characters") ||
      rawMessage.includes("password is too short")
    ) {
      return isHindi
        ? "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।"
        : "Password must be at least 6 characters long.";
    }
    if (rawMessage.includes("Email not confirmed")) {
      return isHindi
        ? "कृपया पहले अपने ईमेल पते की पुष्टि करें।"
        : "Please confirm your email address before signing in.";
    }
    if (
      rawMessage.includes("rate limit") ||
      rawMessage.includes("over_email_send_rate_limit") ||
      rawMessage.includes("security purposes")
    ) {
      return isHindi
        ? "बहुत अधिक प्रयास किए गए। कृपया थोड़ी देर बाद पुनः प्रयास करें।"
        : "Too many attempts. Please wait a few minutes before trying again.";
    }
    if (
      rawMessage.includes("Failed to fetch") ||
      rawMessage.includes("Network")
    ) {
      return isHindi
        ? "सर्वर से कनेक्ट करने में विफल। कृपया अपना इंटरनेट कनेक्शन जांचें।"
        : "Network connection issue. Please check your internet connection and try again.";
    }
    if (rawMessage.includes("Signup requires a valid password")) {
      return isHindi
        ? "कृपया एक वैध पासवर्ड दर्ज करें।"
        : "Please enter a valid password.";
    }

    return (
      rawMessage ||
      (isHindi
        ? "प्रमाणीकरण में त्रुटि हुई। कृपया पुनः प्रयास करें।"
        : "Authentication error. Please try again.")
    );
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError(null);
    setInfoMessage(null);
    setAlternateIdNotice(null);
    setHasAttemptedSubmit(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!isFormValid || loading) return;
    setError(null);
    setInfoMessage(null);
    setAlternateIdNotice(null);
    setLoading(true);

    try {
      if (mode === "signIn") {
        if (!isEmailValid) {
          setError(
            i18n.language?.startsWith("hi")
              ? "कृपया एक वैध ईमेल पता दर्ज करें।"
              : "Please enter a valid email address.",
          );
          setLoading(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(mapSupabaseError(signInError));
        } else {
          navigate("/", { replace: true });
        }
      } else {
        // Sign Up Mode
        if (!name.trim()) {
          setError(
            i18n.language?.startsWith("hi")
              ? "कृपया अपना पूरा नाम दर्ज करें।"
              : "Please enter your full name.",
          );
          setLoading(false);
          return;
        }

        if (!isValidPhone(phone)) {
          setError(
            i18n.language?.startsWith("hi")
              ? "कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।"
              : "Please enter a valid 10-digit mobile number.",
          );
          setLoading(false);
          return;
        }

        if (!isEmailValid) {
          setError(
            i18n.language?.startsWith("hi")
              ? "कृपया एक वैध ईमेल पता दर्ज करें।"
              : "Please enter a valid email address.",
          );
          setLoading(false);
          return;
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
        });

        if (signUpError) {
          setError(mapSupabaseError(signUpError));
        } else if (data?.session) {
          // Direct login
          navigate("/", { replace: true });
        } else {
          // Email confirmation or pending verification
          setInfoMessage(
            i18n.language?.startsWith("hi")
              ? "खाता सफलतापूर्वक बनाया गया! यदि आवश्यक हो तो कृपया अपने ईमेल की पुष्टि करें या साइन इन करें।"
              : "Account created successfully! Please check your email to verify your account, or sign in.",
          );
          setMode("signIn");
        }
      }
    } catch (err) {
      setError(mapSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Language Switcher */}
      <div className="auth-language w-full max-w-md flex justify-end mb-3">
        <div className="inline-flex items-center bg-industrial-panel rounded-lg p-1 border border-industrial-border shadow-card gap-1">
          <button
            type="button"
            onClick={() => i18n.changeLanguage("en")}
            className={`px-3 py-1 rounded font-mono text-xs transition-all duration-150 cursor-pointer ${
              i18n.language?.startsWith("en")
                ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 font-bold translate-y-[1px]"
                : "text-industrial-ink-muted hover:text-industrial-ink"
            }`}
            aria-label="English"
          >
            English
          </button>
          <button
            type="button"
            onClick={() => i18n.changeLanguage("hi")}
            className={`px-3 py-1 rounded font-mono text-xs transition-all duration-150 cursor-pointer ${
              i18n.language?.startsWith("hi")
                ? "bg-industrial-chassis text-industrial-ink shadow-pressed border border-industrial-border/60 font-bold translate-y-[1px]"
                : "text-industrial-ink-muted hover:text-industrial-ink"
            }`}
            aria-label="Hindi"
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Heavy-Gauge Access Panel */}
      <main className="auth-card w-full max-w-md text-left">
        {/* Bezel Header with Corner Screws */}
        <div className="relative bg-industrial-chassis border border-industrial-border shadow-card rounded-xl overflow-hidden">
          {/* Corner Screw Accents */}
          <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-industrial-panel border border-industrial-border/80 shadow-xs flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-industrial-border/60" />
          </div>
          <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-industrial-panel border border-industrial-border/80 shadow-xs flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-industrial-border/60" />
          </div>
          <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-industrial-panel border border-industrial-border/80 shadow-xs flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-industrial-border/60" />
          </div>
          <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-industrial-panel border border-industrial-border/80 shadow-xs flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-industrial-border/60" />
          </div>

          {/* Top Identity Bezel */}
          <div className="auth-header p-5 pb-4 border-b border-industrial-border text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-industrial-recessed border border-industrial-border shadow-recessed rounded-md mb-3 font-mono text-[10px] text-industrial-ink-muted uppercase tracking-wider">
              <LedIndicator color="green" state="blinking" size="sm" />
              GOVT. OF INDIA SECURE GATEWAY • भारत सरकार सुरक्षित पोर्टल
            </div>

            {/* Emblem / Logo Chassis */}
            <img
              className="w-20 h-20 object-contain mx-auto mb-2"
              src="https://lh3.googleusercontent.com/aida/AEtjO1XQ0chKXZN4x3iBM_v57_A4IDJ7GT_m12Tnlui_yZkw7-3ES_3A_C2MHw5PDm-OnBR3SywYJnnb4Sv213XPHi-04B1K53W1wZ4hf5G4Nhx2o9b9lXVCxaePKFpOORpGz7pZoPcjVJw3kaWdmmJRSO6yRK1pk52a6ZAOJsShIW2uq5oCALIrpv9UENMmETFUiDryYr-ET5MV8Tagx0xv65pupAm76WjKnW2LIcGr0Wnir9wDTvpQR0PLY-M"
              alt="YojanaSetu official logo"
            />

            <h1 className="font-mono text-lg font-bold tracking-tight text-industrial-ink">
              YojanaSetu • योजनासेतु
            </h1>
            <p className="font-sans text-xs text-industrial-ink-muted mt-0.5">
              National Welfare & Credit Empowerment Portal
            </p>
            <div className="inline-block mt-1.5 bg-industrial-recessed border border-industrial-border rounded px-2 py-0.5 font-mono text-[10px] text-industrial-ink font-semibold">
              ROLE: APPLICANT // आवेदक
            </div>
          </div>

          {/* Form Panel */}
          <div className="auth-form-panel bg-industrial-panel p-5 sm:p-6 space-y-5">
            {/* Mode Segmented Switch / Rocker Panel */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-industrial-recessed border border-industrial-border shadow-recessed rounded-xl">
              <button
                type="button"
                onClick={() => handleModeChange("signIn")}
                className={`py-2 rounded-lg font-mono text-xs font-bold transition-all duration-150 cursor-pointer ${
                  mode === "signIn"
                    ? "bg-industrial-panel text-industrial-ink shadow-card border border-industrial-border translate-y-0"
                    : "text-industrial-ink-muted hover:text-industrial-ink"
                }`}
              >
                {t("auth.signIn")}
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("signUp")}
                className={`py-2 rounded-lg font-mono text-xs font-bold transition-all duration-150 cursor-pointer ${
                  mode === "signUp"
                    ? "bg-industrial-panel text-industrial-ink shadow-card border border-industrial-border translate-y-0"
                    : "text-industrial-ink-muted hover:text-industrial-ink"
                }`}
              >
                {t("auth.signUp")}
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                className="p-3 bg-red-500/10 text-red-700 rounded-lg flex items-start gap-2.5 border border-red-500/30 font-sans text-xs"
                role="alert"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Info / Success Alert */}
            {infoMessage && (
              <div
                className="p-3 bg-emerald-500/10 text-emerald-700 rounded-lg flex items-start gap-2.5 border border-emerald-500/30 font-sans text-xs"
                role="status"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="leading-relaxed">{infoMessage}</span>
              </div>
            )}

            {/* Context Mode Banner */}
            <div className="bg-industrial-recessed/80 p-3 rounded-lg border border-industrial-border shadow-recessed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-industrial-accent shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-xs font-bold text-industrial-ink">
                  {mode === "signIn"
                    ? "APPLICANT DIRECT SIGN-IN // आवेदक लॉगिन"
                    : "NEW BENEFICIARY REGISTRATION // नया पंजीकरण"}
                </div>
                <div className="font-sans text-xs text-industrial-ink-light mt-0.5">
                  {mode === "signIn"
                    ? "Enter your registered email and password to access your applicant dashboard."
                    : "Register with your name, mobile, and email to check eligibility across 45+ Central & State micro-credit schemes."}
                </div>
              </div>
            </div>

            {/* Main Interaction Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Sign Up: Full Name */}
              {mode === "signUp" && (
                <div className="space-y-1.5">
                  <label
                    className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block"
                    htmlFor="nameInput"
                  >
                    Full Name / पूरा नाम
                  </label>
                  <div
                    className={`flex items-center bg-industrial-recessed rounded-lg border shadow-recessed overflow-hidden transition-colors ${
                      name.trim().length > 0
                        ? "border-emerald-500/40"
                        : "border-industrial-border"
                    }`}
                  >
                    <User className="w-4 h-4 text-industrial-ink-muted ml-3.5 shrink-0" />
                    <input
                      className="w-full h-11 px-3 bg-transparent font-mono text-xs text-industrial-ink placeholder:text-industrial-ink-muted focus:outline-none"
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
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-3.5 shrink-0" />
                    )}
                  </div>
                </div>
              )}

              {/* Sign Up: Phone */}
              {mode === "signUp" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label
                      className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block"
                      htmlFor="mobileInput"
                    >
                      Mobile Number / मोबाइल नंबर
                    </label>
                    <span className="font-mono text-[10px] text-emerald-600 font-semibold">
                      DPDP PROTECTED
                    </span>
                  </div>
                  <div
                    className={`flex items-center bg-industrial-recessed rounded-lg border shadow-recessed overflow-hidden transition-colors ${
                      phone.length > 0 && phone.length < 10
                        ? "border-red-500/40"
                        : phone.length === 10
                          ? "border-emerald-500/40"
                          : "border-industrial-border"
                    }`}
                  >
                    {/* Indian Tricolor Flag Prefix */}
                    <div className="flex items-center gap-2 px-3 py-3 bg-industrial-chassis border-r border-industrial-border shrink-0">
                      <span className="inline-flex flex-col w-4 h-3 justify-between overflow-hidden rounded-[1px] shadow-xs">
                        <span className="h-1 bg-[#FF9933] w-full block" />
                        <span className="h-1 bg-white w-full block relative" />
                        <span className="h-1 bg-[#138808] w-full block" />
                      </span>
                      <span className="font-mono text-xs font-bold text-industrial-ink">
                        +91
                      </span>
                    </div>
                    <Phone className="w-4 h-4 text-industrial-ink-muted ml-3 shrink-0" />
                    <input
                      className="w-full h-11 px-2 bg-transparent font-mono text-xs tracking-wider text-industrial-ink placeholder:text-industrial-ink-muted focus:outline-none"
                      id="mobileInput"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="98765 43210"
                      autoComplete="tel"
                    />
                    {phone.length === 10 && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-3 shrink-0" />
                    )}
                  </div>
                  {phone.length > 0 && phone.length < 10 ? (
                    <p className="font-mono text-[11px] text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {i18n.language?.startsWith("hi")
                          ? `मोबाइल नंबर ठीक 10 अंकों का होना चाहिए (${phone.length}/10 दर्ज)`
                          : `Mobile must be exactly 10 digits (${phone.length}/10 entered)`}
                      </span>
                    </p>
                  ) : (
                    <p className="font-sans text-[11px] text-industrial-ink-light">
                      Used for direct scheme credit updates and e-KYC status
                      tracking.
                    </p>
                  )}
                </div>
              )}

              {/* Email (Both Modes) */}
              <div className="space-y-1.5">
                <label
                  className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block"
                  htmlFor="emailInput"
                >
                  Email Address / ईमेल
                </label>
                <div
                  className={`flex items-center bg-industrial-recessed rounded-lg border shadow-recessed overflow-hidden transition-colors ${
                    email.length > 0 && !isEmailValid
                      ? "border-red-500/40"
                      : email.length > 0 && isEmailValid
                        ? "border-emerald-500/40"
                        : "border-industrial-border"
                  }`}
                >
                  <Mail className="w-4 h-4 text-industrial-ink-muted ml-3.5 shrink-0" />
                  <input
                    className="w-full h-11 px-3 bg-transparent font-mono text-xs text-industrial-ink placeholder:text-industrial-ink-muted focus:outline-none"
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-3.5 shrink-0" />
                  )}
                </div>
                {email.length > 0 && !isEmailValid && (
                  <p className="font-mono text-[11px] text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {i18n.language?.startsWith("hi")
                        ? "कृपया एक वैध ईमेल पता दर्ज करें (उदा. name@example.com)"
                        : "Please enter a valid email format (e.g. name@example.com)"}
                    </span>
                  </p>
                )}
              </div>

              {/* Password (Both Modes) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label
                    className="font-mono text-[10px] uppercase tracking-wider text-industrial-ink-muted font-bold block"
                    htmlFor="passwordInput"
                  >
                    Password / पासवर्ड
                  </label>
                  {mode === "signUp" && (
                    <span className="font-mono text-[10px] text-industrial-ink-muted">
                      Min. 6 characters
                    </span>
                  )}
                </div>
                <div
                  className={`flex items-center bg-industrial-recessed rounded-lg border shadow-recessed overflow-hidden transition-colors ${
                    password.length > 0 && password.length < 6
                      ? "border-red-500/40"
                      : "border-industrial-border"
                  }`}
                >
                  <Lock className="w-4 h-4 text-industrial-ink-muted ml-3.5 shrink-0" />
                  <input
                    className="w-full h-11 px-3 bg-transparent font-mono text-xs text-industrial-ink placeholder:text-industrial-ink-muted focus:outline-none"
                    id="passwordInput"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={
                      mode === "signIn" ? "current-password" : "new-password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-3.5 py-3 text-industrial-ink-muted hover:text-industrial-ink transition-colors focus:outline-none cursor-pointer shrink-0"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="font-mono text-[11px] text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {i18n.language?.startsWith("hi")
                        ? `पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (${password.length}/6 दर्ज)`
                        : `Password must be at least 6 characters (${password.length}/6 entered)`}
                    </span>
                  </p>
                )}
              </div>

              {/* Quick Alternate Identity Strip */}
              <div className="bg-industrial-recessed/60 p-3 rounded-lg border border-industrial-border flex items-center justify-between">
                <div className="flex items-center gap-2 font-sans text-xs text-industrial-ink-light">
                  <Radio className="w-4 h-4 text-industrial-ink-muted shrink-0" />
                  <span>Aadhaar / MeriPehchaan linked?</span>
                </div>
                <button
                  className="font-mono text-xs text-industrial-accent font-bold underline hover:opacity-80 transition-all duration-200 cursor-pointer"
                  onClick={() =>
                    setAlternateIdNotice(
                      "Direct MeriPehchaan National SSO integration is enabled. Enter your registered email to continue.",
                    )
                  }
                  type="button"
                >
                  Direct e-Pehchaan
                </button>
              </div>

              {alternateIdNotice && (
                <div className="p-2.5 px-3 bg-industrial-recessed/80 rounded-lg border border-industrial-border font-mono text-[11px] text-industrial-ink-light">
                  {alternateIdNotice}
                </div>
              )}

              {/* DPDP Statutory Consent (Sign Up only) */}
              {mode === "signUp" && (
                <div className="p-3 bg-industrial-recessed/60 rounded-lg border border-industrial-border flex items-start gap-3">
                  <div className="min-w-[20px] flex items-center justify-center pt-0.5">
                    <input
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="w-4 h-4 rounded bg-industrial-panel border border-industrial-border text-emerald-600 focus:ring-0 cursor-pointer"
                      id="dpdpConsent"
                      required
                      type="checkbox"
                    />
                  </div>
                  <label
                    className="font-sans text-xs text-industrial-ink-light select-none cursor-pointer leading-relaxed"
                    htmlFor="dpdpConsent"
                  >
                    I agree to provide my credentials for MoSJE scheme
                    assistance. My data is protected under the{" "}
                    <strong className="text-industrial-ink">
                      Digital Personal Data Protection (DPDP) Act
                    </strong>
                    .
                  </label>
                </div>
              )}

              {/* Primary CTA Tactile Button */}
              <button
                className={`w-full min-h-[46px] font-mono text-sm font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-150 border ${
                  !isFormValid || loading
                    ? "bg-industrial-recessed/60 text-industrial-ink-muted border-industrial-border/50 cursor-not-allowed shadow-recessed opacity-70"
                    : "bg-industrial-accent text-industrial-ink border-[#c4a96f] shadow-[0_4px_0_0_#b09254,inset_0_1px_0_rgba(255,253,249,0.4)] hover:shadow-[0_2px_0_0_#b09254,inset_0_1px_0_rgba(255,253,249,0.4)] hover:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(17,34,80,0.3)] active:translate-y-[4px] cursor-pointer"
                }`}
                type="submit"
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <>
                    <div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                      role="status"
                      aria-label="Loading"
                    />
                    <span>{t("common.loading", "Loading...")}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                      {mode === "signIn" ? t("auth.signIn") : t("auth.signUp")}
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  enterDemoMode?.();
                  navigate("/", { replace: true });
                }}
                className="w-full min-h-[44px] font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 bg-industrial-chassis text-industrial-ink border border-white/60 shadow-card hover:shadow-floating hover:text-industrial-accent active:shadow-pressed active:translate-y-[2px] transition-all uppercase tracking-wider"
              >
                <Cpu className="w-4 h-4" />
                Evaluator demo access (no cloud login)
              </button>

              {/* Missing fields helper */}
              {hasAttemptedSubmit && !isFormValid && (
                <div
                  className="flex items-center justify-center gap-1.5 text-center font-mono text-[11px] text-red-600"
                  role="status"
                >
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{getMissingFieldText()}</span>
                </div>
              )}
            </form>

            {/* Civic Assistance Section */}
            <div className="pt-4 border-t border-industrial-border space-y-3">
              <div className="bg-industrial-recessed/60 p-3.5 rounded-lg border border-industrial-border space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-industrial-ink">
                  <Info className="w-4 h-4 text-industrial-accent" />
                  Need Help / सहायता चाहिए?
                </div>
                <p className="font-sans text-xs text-industrial-ink-light leading-relaxed">
                  Having trouble? You can also authenticate using{" "}
                  <strong className="text-industrial-ink">
                    Jan Samarth / MeriPehchaan
                  </strong>{" "}
                  or visit your nearest Gram Panchayat{" "}
                  <strong className="text-industrial-ink">
                    Common Service Centre (CSC)
                  </strong>{" "}
                  for assisted biometrics.
                </p>
                <div className="flex items-center justify-between pt-1 font-mono text-[11px] text-industrial-ink-light">
                  <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    3.8 Lakh+ CSCs Active
                  </span>
                  <span className="text-industrial-ink">
                    Gram Panchayat CSCs
                  </span>
                </div>
              </div>

              {/* Trust Badge Strip */}
              <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
                <div className="p-2 bg-industrial-recessed rounded-lg border border-industrial-border shadow-recessed">
                  <span className="text-[11px] font-bold text-industrial-ink block">
                    Zero Spam
                  </span>
                  <span className="text-[10px] text-industrial-ink-muted">
                    Govt. Only
                  </span>
                </div>
                <div className="p-2 bg-industrial-recessed rounded-lg border border-industrial-border shadow-recessed">
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    256-bit SSL
                  </span>
                  <span className="text-[10px] text-industrial-ink-muted">
                    NIC Certified
                  </span>
                </div>
                <div className="p-2 bg-industrial-recessed rounded-lg border border-industrial-border shadow-recessed">
                  <span className="text-[11px] font-bold text-industrial-ink block">
                    DPDP Ready
                  </span>
                  <span className="text-[10px] text-industrial-ink-muted">
                    Data Privacy
                  </span>
                </div>
              </div>

              {/* Staff / Official Portal Switch */}
              <div className="text-center pt-1">
                <p className="font-sans text-xs text-industrial-ink-light">
                  Channel Partner, Inspector, or Bank Officer?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleModeChange("signIn");
                    setEmail("admin@yojanasetu.gov.in");
                  }}
                  className="font-mono text-xs text-industrial-accent font-bold underline hover:opacity-80 transition-all duration-200 mt-0.5 cursor-pointer"
                >
                  Click here for Staff & Official Portal Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
