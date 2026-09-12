import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  FileCheck,
  Save,
  ShieldCheck,
  X,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import IndustrialCard from "../components/ui/IndustrialCard";
import TactileButton from "../components/ui/TactileButton";

const STATUS_LABELS = {
  pending: ["Pending review", "समीक्षा लंबित"],
  pending_review: ["Pending review", "समीक्षा लंबित"],
  verified: ["Verified", "सत्यापित"],
  rejected: ["Rejected", "अस्वीकृत"],
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith("hi");
  const text = (english, hindi) => (isHindi ? hindi : english);
  const { user, profile, updateProfile } = useAuth();

  const [name, setName] = useState(
    profile?.name || user?.user_metadata?.full_name || "",
  );
  const [phone, setPhone] = useState(
    profile?.phone || user?.user_metadata?.phone || "",
  );
  // Documents are managed from the Dashboard readiness checklist only;
  // this page mirrors the saved list and must stay read-only.
  const [documents, setDocuments] = useState(profile?.documents || []);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDocuments(profile?.documents || []);
  }, [profile?.documents]);

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      // Only save identity fields; never write the documents array from
      // here so we cannot clobber documents attached via the readiness check.
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      });
      setMessage(
        text(
          "Profile saved successfully.",
          "प्रोफ़ाइल सफलतापूर्वक सहेजी गई।",
        ),
      );
      setTimeout(() => setMessage(""), 3500);
    } catch {
      setMessage(
        text(
          "Could not save your profile. Please try again.",
          "प्रोफ़ाइल सहेजी नहीं जा सकी। कृपया पुनः प्रयास करें।",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const emailVerified = Boolean(
    user?.email_confirmed_at ||
      profile?.email_verified_at ||
      profile?.verification_status === "email_verified" ||
      profile?.verification_status === "verified",
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6 text-left">
      <IndustrialCard className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-accent">
              {text("Citizen Profile", "नागरिक प्रोफ़ाइल")} // नागरिक प्रोफ़ाइल
            </p>
            <h1 className="font-mono text-2xl font-bold text-ink">
              {text("View and update your profile", "अपनी प्रोफ़ाइल देखें और अपडेट करें")}
            </h1>
            <p className="font-sans text-sm text-ink-muted">
              {text(
                "Email verification and document status are stored securely with your account.",
                "ईमेल सत्यापन और दस्तावेज़ स्थिति आपके खाते में सुरक्षित रूप से संग्रहीत है।",
              )}
            </p>
          </div>
          {/* Close option: dedicated header button returning to the dashboard */}
          <button
            type="button"
            aria-label={text("Close profile", "प्रोफ़ाइल बंद करें")}
            title={text("Close profile", "प्रोफ़ाइल बंद करें")}
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-lg border border-chassis-dark/25 text-ink-muted hover:text-ink hover:bg-panel flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-recessed border border-chassis-dark/20">
            {text("Email", "ईमेल")}: <strong>{user?.email || "demo account"}</strong>
          </div>
          <div className="p-3 rounded-lg bg-recessed border border-chassis-dark/20 flex items-center gap-2">
            <CheckCircle2
              className={`w-4 h-4 ${emailVerified ? "text-emerald-600" : "text-accent"}`}
            />
            {emailVerified
              ? text("Email verified", "ईमेल सत्यापित")
              : text("Email verification pending", "ईमेल सत्यापन लंबित")}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <label className="block font-mono text-xs font-bold">
            {text("Full name", "पूरा नाम")} / पूरा नाम
            <input
              className="mt-1 w-full h-11 px-3 rounded-lg bg-recessed border border-chassis-dark/30"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block font-mono text-xs font-bold">
            {text("Mobile number", "मोबाइल नंबर")} / मोबाइल नंबर
            <input
              className="mt-1 w-full h-11 px-3 rounded-lg bg-recessed border border-chassis-dark/30"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              inputMode="numeric"
            />
          </label>

          {/* Read-only document list. Attachments happen through the
              Dashboard "Document Readiness Checklist", not from the profile. */}
          <div className="p-3 rounded-lg bg-recessed border border-chassis-dark/25 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-accent" />
                {text("Attached documents", "संलग्न दस्तावेज़")}
              </span>
              <span className="font-mono text-[11px] text-ink-muted">
                {documents.length} {text("attached", "संलग्न")}
              </span>
            </div>
            {documents.length === 0 ? (
              <p className="font-mono text-xs text-ink-muted">
                {text(
                  "No documents attached yet. Attach them from the Dashboard readiness checklist so they stay tied to an application requirement.",
                  "अभी कोई दस्तावेज़ संलग्न नहीं है। इन्हें डैशबोर्ड की दस्तावेज़ तैयारी सूची से संलग्न करें ताकि वे आवेदन आवश्यकता से जुड़े रहें।",
                )}
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((document, index) => {
                  const statusLabel =
                    STATUS_LABELS[document.status] || [
                      document.status || "pending",
                      document.status || "लंबित",
                    ];
                  return (
                    <div
                      key={`${document.name}-${index}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-panel border border-chassis-dark/20 font-mono text-xs"
                    >
                      <span className="truncate">
                        {document.categoryLabel || document.name}
                      </span>
                      <span className="text-accent uppercase shrink-0">
                        {text(statusLabel[0], statusLabel[1])}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="font-mono text-[11px] text-ink-muted flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              {text(
                "Documents are attached and removed from the Dashboard readiness checklist.",
                "दस्तावेज़ डैशबोर्ड की तैयारी सूची से ही जोड़े और हटाए जाते हैं।",
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <TactileButton variant="primary" type="submit" disabled={isSaving}>
              <Save className="w-4 h-4" />{" "}
              {isSaving
                ? text("Saving...", "सहेज रहे हैं...")
                : text("Save profile", "प्रोफ़ाइल सहेजें")}
            </TactileButton>
            {/* Explicit Close action so users are never stuck on the page */}
            <TactileButton
              variant="secondary"
              onClick={() => navigate("/")}
            >
              {text("Close profile", "प्रोफ़ाइल बंद करें")}
              <ArrowRight className="w-4 h-4" />
            </TactileButton>
            {message && (
              <p className="font-mono text-xs text-emerald-700">{message}</p>
            )}
          </div>
        </form>
      </IndustrialCard>
    </div>
  );
}
