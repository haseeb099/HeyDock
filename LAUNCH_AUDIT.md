# HeyDock launch audit — 18 November 2026

## Completed source checks

- Recovered the published 39-page source and checked GitHub main before editing.
- Standalone HeyDock branding in page content, metadata, generated briefs and structured data. No replacement legal entity has been invented. Legal operator details remain a launch prerequisite.
- Mobile menu closes on Escape, outside clicks, focus departure and navigation; resets at desktop width. Styled disclosure selectors progressively enhance the native controls, with keyboard focus and Escape dismissal.
- Distinct specialist service icons, responsive constraints, 16px form inputs, touch targets and reduced-motion support.
- Cloudflare Pages `_headers`: CSP with exact JSON-LD hashes, frame restrictions, MIME protection, referrer and permissions policies, HSTS. These apply on Cloudflare Pages application responses, not the ChatGPT sign-in gateway. Verify on production after deployment.
- 1200×630 PNG social image, Open Graph metadata, canonical and structured-data generation.
- Public builds fail unless an explicit HTTPS production origin replaces the preview origin. Default builds retain noindex and robots disallow.
- Build and JavaScript syntax checks pass. `python3 audit.py` checks all 39 pages for broken local asset/navigation paths, duplicate IDs/titles, old branding, metadata, JSON-LD parsing/CSP hashes, and a limited set of secret signatures. 70 FAQ answers found.
- Public-origin fixture build passed, then preview build restored. Invalid public build with preview origin rejected.

## Security boundaries

This is a static brochure/catalogue site with browser-local brief generation. There is no application login/admin, database, email sender, AI inference endpoint, booking integration or third-party runtime dependency. Form fields have client limits; there is no server receiving them. Rate limiting and server validation must be added when a receiver is implemented. A 1,000-request AI cost estimate is not applicable to this implementation.

The signature scan is limited and is not proof that all secrets are absent. Historical source review requires a complete repository checkout. No secret values are recorded in this report.

## Still unverified / blocked

- Production DNS, custom domain, HTTPS responses, true 404 status and security headers: production domain/hosting not supplied.
- Live enquiry validation, spam/rate controls, errors, confirmations and inbox delivery: no provider or monitored recipient configured. Current UI accurately states nothing is sent.
- SPF/DKIM/DMARC: domain and mailbox provider/selector not supplied.
- Browser/mobile interaction, measured overflow, keyboard walkthrough, screen reader, contrast and Lighthouse scores: not yet measured; source improvements are not a browser certification.
- Production uptime alerts, error tracking and restore rehearsal: account integrations not configured.
- Privacy notice and company disclosures: legal operator, address and privacy contact must be confirmed. Brand-only presentation is not legal incorporation.

## Deployment and recovery

Use Cloudflare Pages: branch main, framework None, build `python3 build.py`, output `dist`. Test a preview first. Set HEYDOCK_ORIGIN to the final HTTPS domain. Enable HEYDOCK_PUBLIC=1 only after contact delivery and disclosures are ready. The repository includes no credentials.

Use immutable deployments. To restore, choose the last known working deployment in Cloudflare and roll back; confirm homepage, contact page, assets, headers and 404. Source recovery: clone the repository and run the build with the same origin/indexing variables. Rehearse this on a separate preview before public launch.

After launch, configure an external HTTPS uptime monitor for homepage and contact route and a monitored notification address. Review email failures with the selected sender. Do not log enquiry contents or credentials in application logs.
