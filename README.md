# HeyDock website

Corporate website for **HeyDock**, the customer-facing IT services brand of **Infintree Limited**. The site covers on-site IT support and engineer dispatch for UK businesses and MSPs, plus staffing, managed IT, networks, cloud, cybersecurity, software and AI automation.

The site is built with [Astro](https://astro.build) as a static site and is intended for [Cloudflare Pages](https://developers.cloudflare.com/pages/), with the enquiry API remaining a Cloudflare Pages Function at `functions/api/enquiry.js`.

## Local development

Requirements: Node.js 20 or newer.

```bash
npm ci
npm run dev
```

```bash
npm run build
npm test
npm run preview
```

Output directory: `dist`. Do not commit `dist`, `node_modules` or `.astro`.

The previous Python static generator (`build.py`, `enrich.py`, `launch.py`, `audit.py`) is kept under `legacy/` for reference and is not used by the current build.

## Content

- Services: `src/content/services/` (one Markdown file per service)
- Industries: `src/content/industries/`
- Resources / guides: `src/content/resources/`
- Operator and contact details: `content/site.json` (environment variables override this file)

Public builds must not invent client names, testimonials, certifications or performance statistics. Social-engineering and phishing offers are ethical, authorised awareness and simulation only.

## Build environment variables

Set these in Cloudflare Pages → Settings → Environment variables (Production, and Preview if you want preview builds to be indexable — usually leave Preview unset so they stay noindex).

| Variable | Purpose |
| --- | --- |
| `HEYDOCK_ORIGIN` | Final HTTPS origin used for canonical URLs, Open Graph, sitemap, robots and JSON-LD. Production should be `https://hdocks.com` (or the live custom domain). |
| `HEYDOCK_PUBLIC=1` | Allow indexing (`robots.txt` Allow + sitemap, and `index,follow` meta). Builds without this stay noindex. Public builds fail if the origin is a `chatgpt.site` preview, is not HTTPS, or required disclosures are missing. |
| `HEYDOCK_CONTACT_EMAIL` | Public business email (overrides `content/site.json`). |
| `HEYDOCK_CONTACT_PHONE` | Public telephone number. |
| `HEYDOCK_OPERATOR_NAME` | Legal operator name. |
| `HEYDOCK_COMPANY_NUMBER` | Companies House number. |
| `HEYDOCK_REGISTERED_OFFICE` | Registered office. |
| `HEYDOCK_REGISTRATION_JURISDICTION` | Required for public builds (for example `England and Wales`). |
| `HEYDOCK_VAT_NUMBER` | Optional VAT number when verified. |

Verified operator fields already live in `content/site.json` (Infintree Limited / 17100814 / England and Wales). Environment variables override that file.

Example production build:

```bash
HEYDOCK_ORIGIN=https://hdocks.com HEYDOCK_PUBLIC=1 npm run build
```

## Enquiry delivery (Cloudflare Pages Functions)

The contact form posts JSON (or form data) to `POST /api/enquiry`. The Function validates input, applies a honeypot and a per-isolate rate limit, and sends mail through Resend. Enquiry text is never placed in URLs. Secrets must not be committed or written to application logs.

### Runtime secrets (Pages project → Settings → Environment variables)

These are **runtime** Function secrets, not build arguments.

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Yes | Resend API key (`re_…`). Server-side only. |
| `HEYDOCK_FROM_EMAIL` | Yes | Resend-verified sender, e.g. `HeyDock <hello@your-verified-domain>`. |
| `HEYDOCK_TO_EMAIL` | Yes | Monitored business inbox. Production value: `operations@hdocks.com`. |

Setup remains: verify the sending domain in Resend, add the three variables on the Pages project, deploy so `/api/enquiry` is on the same host as the static site, then send a synthetic enquiry from `/contact`.

## Cloudflare Pages settings (change these before going live on this branch)

Do not change these in the Cloudflare dashboard from this repository task — they are listed so they can be updated at launch.

| Setting | Value |
| --- | --- |
| Framework preset | Astro, or None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (repository root) |
| Node version | `20` or newer (for example `NODE_VERSION=20`) |
| Functions | Automatic from `/functions` — keep this enabled |
| Build env | `HEYDOCK_ORIGIN=https://hdocks.com`, `HEYDOCK_PUBLIC=1`, plus any operator overrides you need |
| Runtime env / secrets | `RESEND_API_KEY`, `HEYDOCK_FROM_EMAIL`, `HEYDOCK_TO_EMAIL` |
| Redirects | `public/_redirects` is copied into `dist/_redirects` (301s from every previous `.html` URL) |
| Headers | `public/_headers` is copied into `dist/_headers` |

Custom domain, DNS and access settings stay as they are today. `HEYDOCK_PUBLIC=1` only controls indexing metadata; it does not change host access.

URLs are clean (no `.html` in paths or internal links). Old addresses such as `/it-support.html` and `/contact.html` 301 to the new paths (for example `/services/it-support` and `/contact`).

## Release checks

Pull requests run `.github/workflows/release-checks.yml`: `npm ci`, a preview build, enquiry and site-audit tests, a negative public-build check (empty registration jurisdiction must fail), and a production-mode fixture that greps for the trading-name disclosure, `#company-details`, `robots.txt` Allow + sitemap, and the absence of `.html` links.
