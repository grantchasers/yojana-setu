import { useAuth } from "../context/AuthContext";
import { usePartners } from "../hooks/usePartners";
import IndustrialCard from "../components/ui/IndustrialCard";

export default function PartnerPortalPage() {
  const { profile } = useAuth();
  const { partners, loading } = usePartners();
  const ownPartner = partners.find(
    (partner) => partner.id === profile?.partner_id,
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <IndustrialCard className="p-6 space-y-2">
        <p className="font-mono text-xs uppercase tracking-wider text-accent">
          Partner workspace // साझेदार कार्यक्षेत्र
        </p>
        <h1 className="font-mono text-2xl font-bold text-ink">
          Channel partner portal
        </h1>
        <p className="font-sans text-sm text-ink-muted">
          This workspace shows only records provisioned for the signed-in
          partner account.
        </p>
      </IndustrialCard>
      <IndustrialCard className="p-6">
        {loading ? (
          <p className="font-mono text-xs text-ink-muted">
            Loading partner record...
          </p>
        ) : ownPartner ? (
          <div className="space-y-2 font-mono text-sm">
            <strong>{ownPartner.name}</strong>
            <p className="text-xs text-ink-muted">
              {ownPartner.location ||
                ownPartner.address ||
                "Location not provided"}
            </p>
            <p className="text-xs">
              Routing status:{" "}
              {ownPartner.is_eligible ? "Active" : "Pending approval"}
            </p>
          </div>
        ) : (
          <p className="font-mono text-xs text-ink-muted">
            No partner record is linked to this account. Contact an
            administrator for provisioning.
          </p>
        )}
      </IndustrialCard>
    </div>
  );
}
