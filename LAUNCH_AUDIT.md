# HeyDock launch audit — updated 22 November 2026

## Implemented in source (branch `feature/public-launch-enquiries`)

- Enquiry form posts to Cloudflare Pages Function `POST /api/enquiry` with server validation, honeypot, rate limiting and Resend delivery helpers.
- Client UI: “Send enquiry” button, sending state, double-submit lock, success only after HTTP success, values preserved on failure, retry control.
- Homepage refocused on on-site IT support / engineer dispatch with primary CTA `Request an engineer` and secondary CTA `Discuss white-label support`.
- Dispatch and partners pages explain bookable work, quoting inputs, post-submission flow, and a clearly labelled illustrative (fictional) job report.
- Privacy / company / about / accessibility copy updated for enquiry processing; operator fields remain pending unless build env supplies them.
- Preview strip removed when `HEYDOCK_PUBLIC=1`. CSP allows same-origin `connect-src` / `form-action` for the enquiry API.
- GitHub Actions workflow `.github/workflows/release-checks.yml` added.
- UTF-8 explicit file I/O so Windows builds do not fail on menu/symbol characters.

## Checks that actually ran (this session)

| Check | Result |
| --- | --- |
| `python build.py` (preview) | **PASS** — 39 pages |
| `python audit.py` | **PASS** — 0 errors, 74 FAQ answers |
| `node --check dist/app.js` | **PASS** |
| `node --test tests/enquiry.test.mjs` (mocked Resend) | **PASS** — 11/11 |
| Production fixture build (`HEYDOCK_ORIGIN=https://example.com`, `HEYDOCK_PUBLIC=1`, contact email set) | **PASS** — Allow robots, sitemap/canonicals on example.com, no preview strip, contact email rendered, audit PASS |
| Local browser (mobile-width): homepage CTAs, menu open + Escape close | **PASS** |
| Local browser: `?service=engineer-dispatch` and `?audience=partner` preselection | **PASS** |
| Local browser: empty submit focuses first required field | **PASS** |
| Local browser: filled submit against static server (no Function) shows error, keeps values, re-enables submit | **PASS** (simulates provider/host failure) |
| Live inbox delivery via Resend | **Not verified** — credentials / mailbox not supplied |
| Production Cloudflare custom domain logged-out access, real 404, indexing enablement | **Not verified** — hosting access / final domain not supplied |
| Deployed preview journey | **Not run** — no approved production/preview deploy in this session |

## Security boundaries

- `RESEND_API_KEY`, `HEYDOCK_FROM_EMAIL`, `HEYDOCK_TO_EMAIL` are runtime Function secrets only.
- Enquiry bodies must not be written to logs; the Function logs only a failure code/status.
- Rate limiting is best-effort per Cloudflare isolate (appropriate for Pages Functions; not a global edge rate store).

## Documents & policies (follow-up on this PR)

- Added `/documents.html` hub plus cookies, complaints, support/escalation, security/data-handling and vendor-onboarding pages; expanded privacy, terms, accessibility and how-we-work.
- Operator details use `content/site.json` + env overrides. Public builds report missing disclosures and avoid “pending confirmation” copy; CI uses synthetic fixture identities only.
- No client template pack was present in the repo; no agreements/insurance downloads published.

## Company disclosure (Companies House 17100814)

- Operator: Infintree Limited; jurisdiction England and Wales; office Flat, 38a The Common, Hatfield, United Kingdom, AL10 0LU; contact hey@heydock.com
- Full disclosure on `/contact.html#company-details`; compact footer link only
- VAT still blank until verified

## Still required for production go-live

1. Final HTTPS domain → `HEYDOCK_ORIGIN`
2. Cloudflare Function secrets: `RESEND_API_KEY`, Resend-verified `HEYDOCK_FROM_EMAIL`, `HEYDOCK_TO_EMAIL=hey@heydock.com` — **live inbox delivery not verified in this session**
3. Any approved city list, support hours, complaint SLAs or security certifications before publishing as commitments
4. Approved public downloads (if any) for NDAs/MSAs/insurance — otherwise keep private
5. Cloudflare Pages: public visitor access (no sign-in gate), custom domain, then indexing after launch checks
6. Public crawlability and mobile performance on the deployed URL
7. VAT number only if/when verified

## Deployment reminder

Cloudflare Pages: build `python3 build.py`, output `dist`, Functions from `/functions`. Keep preview builds without `HEYDOCK_PUBLIC=1`. Do not claim the public site is live or that email delivery passed without verifying on the real host and inbox.
