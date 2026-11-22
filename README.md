# HeyDock website

Static website for HeyDock: on-site IT support and engineer dispatch for UK businesses and MSPs, with software and AI automation pages retained. Page generation is Python-driven (`build.py`, `enrich.py`, `launch.py`). Shared styles and interactions live in `dist/styles.css` and `dist/app.js`. Cloudflare Pages Functions live under `functions/`.

## Build

```bash
python3 build.py
python3 audit.py
node --check dist/app.js
node --test tests/enquiry.test.mjs
```

Output directory: `dist`. No pip/npm packages are required for the static build.

### Build environment variables

| Variable | Purpose |
| --- | --- |
| `HEYDOCK_ORIGIN` | Final HTTPS origin used for canonical URLs, Open Graph, sitemap and robots. Default is the private preview origin. |
| `HEYDOCK_PUBLIC=1` | Allow indexing (`robots.txt` Allow + `index,follow`). Preview/default builds stay noindex. Public builds fail if the origin is still a `chatgpt.site` preview or non-HTTPS. |
| `HEYDOCK_CONTACT_EMAIL` | Public business email when verified (overrides `content/site.json`). |
| `HEYDOCK_OPERATOR_NAME` | Verified legal operator name (overrides `content/site.json`). |
| `HEYDOCK_COMPANY_NUMBER` | Verified company number. |
| `HEYDOCK_REGISTERED_OFFICE` | Verified registered office. |
| `HEYDOCK_REGISTRATION_JURISDICTION` | Optional registration jurisdiction. |
| `HEYDOCK_VAT_NUMBER` | Optional VAT number when verified. |

Verified operator fields live in `content/site.json` (Infintree Limited / Companies House 17100814 / England and Wales). Environment variables override that file. Public builds (`HEYDOCK_PUBLIC=1`) exit non-zero if operator name, company number, registered office, registration jurisdiction or contact email is missing. Preview builds remain allowed with incomplete fields. CI production fixtures use synthetic values and include a negative empty-jurisdiction override check.

Example production build:

```bash
HEYDOCK_ORIGIN=https://www.example.com HEYDOCK_PUBLIC=1 HEYDOCK_CONTACT_EMAIL=enquiries@example.com python3 build.py
```

## Enquiry delivery (Cloudflare Pages Functions)

The contact form posts JSON to `POST /api/enquiry` (`functions/api/enquiry.js`). The Function validates input, applies honeypot + per-isolate rate limiting, and sends mail through Resend. Enquiry text is never placed in URLs. Secrets must not be committed, bundled into `dist/app.js`, or written to application logs.

### Runtime secrets / env (Pages project → Settings → Environment variables)

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes | Resend API key (`re_…`). Server-side only. |
| `HEYDOCK_FROM_EMAIL` | Yes | Verified Resend sender, e.g. `HeyDock <hello@your-domain>`. |
| `HEYDOCK_TO_EMAIL` | Yes | Monitored business inbox. Production value: `operations@hdocks.com`. |
| `HEYDOCK_FROM_EMAIL` | Yes | Resend-verified sender, e.g. `HeyDock <hello@your-verified-domain>`. |
| `RESEND_API_KEY` | Yes | Resend API key (`re_…`). Cloudflare secret only. |

Setup steps:

1. Create a Resend account and verify the sending domain (SPF/DKIM/DMARC as Resend instructs).
2. Create an API key with send permission.
3. In the Cloudflare Worker settings, add `RESEND_API_KEY` as a secret and `HEYDOCK_FROM_EMAIL` as a Resend-verified sender. `wrangler.jsonc` sets the production recipient to `operations@hdocks.com`.
4. Deploy so `/api/enquiry` is live on the same host as the static site.
5. Submit a synthetic enquiry from `/contact.html` and confirm delivery in `operations@hdocks.com`.
6. Public contact display uses `operations@hdocks.com` from `content/site.json` / `HEYDOCK_CONTACT_EMAIL`.

## Cloudflare Pages deployment

- Framework preset: None
- Build command: `python3 build.py`
- Build output directory: `dist`
- Functions: automatically from `/functions`
- Custom domain: attach the final HTTPS hostname in Cloudflare Pages, then set `HEYDOCK_ORIGIN` to that origin for production builds
- Public visitor access: configure the Pages project so the site is reachable without sign-in. `HEYDOCK_PUBLIC=1` only controls indexing metadata; it does not change host access by itself
- Enable `HEYDOCK_PUBLIC=1` only after launch checks pass (homepage + contact logged out, 404 behaviour, canonical/sitemap domain, test enquiry delivered)

Do not deploy to production from this repository change unless existing access and approval already cover that environment.

## Update software catalogue

Edit `content/catalog.json`, keep unique URL-safe slugs, run `python3 build.py`, inspect catalogue and detail pages. Add new categories to the selector in `build.py` if needed.

## Release checks

Pull requests run `.github/workflows/release-checks.yml`: preview build, `audit.py`, `node --check dist/app.js`, a production-mode fixture build, and mocked enquiry tests.

## Still required before claiming the public site is live

- Final HTTPS domain for `HEYDOCK_ORIGIN`
- Resend verified sender + API key + monitored inbox
- Optional public `HEYDOCK_CONTACT_EMAIL`
- Verified operator name, company number, registered office (and VAT if applicable)
- Approved coverage cities / support hours / SLAs before publishing them as commitments
- Trademark / domain clearance where still outstanding
- Production deploy access and logged-out verification on the real host

See `LAUNCH_AUDIT.md` for check status.
