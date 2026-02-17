interface AffiliateDisclosureProps {
  affiliateDisclosure: string;
  medicalDisclaimer: string;
  className?: string;
}

export function AffiliateDisclosure({
  affiliateDisclosure,
  medicalDisclaimer,
  className,
}: AffiliateDisclosureProps) {
  return (
    <aside className={`rounded-lg border border-border/70 bg-background/70 p-3 ${className ?? ""}`}>
      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Affiliate disclosure:</span> {affiliateDisclosure}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">Health disclaimer:</span> {medicalDisclaimer}
      </p>
    </aside>
  );
}
