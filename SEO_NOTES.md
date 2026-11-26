# SEO, GEO and AEO notes

The Astro site emits, on every page:

- Unique title, meta description, optional keywords
- Canonical URL from `HEYDOCK_ORIGIN`
- Open Graph and Twitter card tags
- `robots` `index,follow` only when `HEYDOCK_PUBLIC=1`
- JSON-LD `@graph` with Organization, LocalBusiness and WebSite, plus page-level Service, FAQPage, Article and BreadcrumbList where relevant

There is no visible breadcrumb bar. BreadcrumbList JSON-LD in the document head is intentional.

`robots.txt` allows indexing and points at `/sitemap-index.xml` when the build is public. `llms.txt` describes the brand, operator, contact route and content limits for assistants.

Internal links use clean paths such as `/services/cybersecurity`. 301 redirects from the previous `.html` URLs live in `public/_redirects` (and are honoured by `worker.mjs` if that entry is used).

Do not invent testimonials, client names, certifications or quantitative claims in content or structured data. Social-engineering pages must remain framed as ethical, authorised awareness and simulation.
