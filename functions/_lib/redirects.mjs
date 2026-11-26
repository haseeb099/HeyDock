/**
 * Permanent redirects from the previous .html site to clean URLs.
 * Used by public/_redirects (Cloudflare Pages) and worker.mjs.
 */
export const REDIRECTS = [
  // Home and company / policy pages
  ['/index.html', '/'],
  ['/404.html', '/'],
  ['/services.html', '/services'],
  ['/about.html', '/about'],
  ['/contact.html', '/contact'],
  ['/how-we-work.html', '/how-we-work'],
  ['/coverage.html', '/coverage'],
  ['/partners.html', '/partners'],
  ['/solutions.html', '/solutions'],
  ['/documents.html', '/documents'],
  ['/privacy.html', '/privacy'],
  ['/cookies.html', '/cookies'],
  ['/terms.html', '/terms'],
  ['/accessibility.html', '/accessibility'],
  ['/complaints.html', '/complaints'],
  ['/support-and-escalation.html', '/support-and-escalation'],
  ['/security-and-data-handling.html', '/security-and-data-handling'],
  ['/vendor-onboarding.html', '/vendor-onboarding'],
  ['/resources.html', '/resources'],
  ['/resources/plan-an-it-rollout.html', '/resources/plan-an-it-rollout'],
  ['/resources/choose-business-software.html', '/resources/choose-business-software'],
  ['/resources/scope-an-ai-pilot.html', '/resources/scope-an-ai-pilot'],

  // Services that lived at the site root (with and without .html)
  ['/it-support.html', '/services/it-support'],
  ['/it-support', '/services/it-support'],
  ['/engineer-dispatch.html', '/services/engineer-dispatch'],
  ['/engineer-dispatch', '/services/engineer-dispatch'],
  ['/remote-talent.html', '/services/remote-technical-talent'],
  ['/remote-talent', '/services/remote-technical-talent'],
  ['/custom-software.html', '/services/custom-software'],
  ['/custom-software', '/services/custom-software'],
  ['/ai-automation.html', '/services/ai-automation'],
  ['/ai-automation', '/services/ai-automation'],
  ['/software.html', '/services/business-software'],
  ['/software', '/services/business-software'],
  ['/software/hr-management.html', '/services/business-software'],
  ['/software/hr-management', '/services/business-software'],
  ['/software/small-business-erp.html', '/services/business-software'],
  ['/software/small-business-erp', '/services/business-software'],
  ['/software/ticketing-service-desk.html', '/services/business-software'],
  ['/software/ticketing-service-desk', '/services/business-software'],
  ['/software/booking-management.html', '/services/business-software'],
  ['/software/booking-management', '/services/business-software'],
  ['/software/appointment-scheduling.html', '/services/business-software'],
  ['/software/appointment-scheduling', '/services/business-software'],
  ['/managed-it-services.html', '/services/managed-it-services'],
  ['/managed-it-services', '/services/managed-it-services'],
  ['/microsoft-365.html', '/services/microsoft-365'],
  ['/microsoft-365', '/services/microsoft-365'],
  ['/network-wifi.html', '/services/network-wifi'],
  ['/network-wifi', '/services/network-wifi'],
  ['/backup-disaster-recovery.html', '/services/business-continuity-disaster-recovery'],
  ['/backup-disaster-recovery', '/services/business-continuity-disaster-recovery'],
  ['/cybersecurity.html', '/services/cybersecurity'],
  ['/cybersecurity', '/services/cybersecurity'],
  ['/data-centre-support.html', '/services/data-centre-support'],
  ['/data-centre-support', '/services/data-centre-support'],
  ['/it-rollouts-migrations.html', '/services/it-rollouts-migrations'],
  ['/it-rollouts-migrations', '/services/it-rollouts-migrations'],
  ['/hardware-break-fix.html', '/services/hardware-break-fix'],
  ['/hardware-break-fix', '/services/hardware-break-fix'],
  ['/it-asset-disposal.html', '/services/it-asset-disposal'],
  ['/it-asset-disposal', '/services/it-asset-disposal'],
  ['/meeting-room-av.html', '/services/meeting-room-av'],
  ['/meeting-room-av', '/services/meeting-room-av'],
  ['/business-connectivity-telephony.html', '/services/business-connectivity-telephony'],
  ['/business-connectivity-telephony', '/services/business-connectivity-telephony'],
  ['/it-consultancy.html', '/services/it-consultancy-site-surveys'],
  ['/it-consultancy', '/services/it-consultancy-site-surveys'],
];

export function lookupRedirect(pathname) {
  const exact = REDIRECTS.find(([from]) => from === pathname);
  if (exact) return exact[1];
  if (pathname.endsWith('.html')) {
    const stripped = pathname.slice(0, -5);
    if (stripped === '/index' || stripped === '') return '/';
    const mapped = REDIRECTS.find(([from]) => from === pathname || from === stripped);
    if (mapped) return mapped[1];
    return stripped;
  }
  return null;
}
