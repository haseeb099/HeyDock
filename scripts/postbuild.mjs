/**
 * Post-build checks for the HeyDock static site.
 * Fails the build if rendered links contain .html, a visible breadcrumb bar
 * is present, or a master-list service page is missing.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const servicesDir = join(root, 'src/content/services');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const htmlFiles = (await walk(dist)).filter((f) => f.endsWith('.html'));
if (!htmlFiles.length) {
  throw new Error('postbuild: no HTML files in dist/');
}

const errors = [];

const hrefRe = /\b(?:href|src|action)=["']([^"']+)["']/gi;
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = relative(dist, file);
  let match;
  hrefRe.lastIndex = 0;
  while ((match = hrefRe.exec(html))) {
    const url = match[1];
    if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('data:') || url.startsWith('#')) continue;
    const pathOnly = url.split(/[?#]/)[0];
    if (/\.html$/i.test(pathOnly)) {
      errors.push(`${rel}: rendered ${match[0]} contains .html`);
    }
  }

  // Visible breadcrumb / slug + page-name bar (JSON-LD BreadcrumbList in <head> is fine)
  const body = html.split(/<body/i)[1] || html;
  if (/\bclass=["'][^"']*\bbreadcrumb/i.test(body) || /\baria-label=["']Breadcrumb/i.test(body) || /\b<nav[^>]*breadcrumb/i.test(body)) {
    errors.push(`${rel}: visible breadcrumb markup found in the body`);
  }
  // Common "Home / Page" trail immediately under a header, excluding JSON-LD
  const visible = stripTags(body);
  if (/\bHome\s+\/\s+[A-Z]/.test(visible) && !rel.endsWith('404.html')) {
    // Allow sentences that happen to contain "Home /" only if they look like crumbs
    errors.push(`${rel}: visible "Home / …" breadcrumb text found`);
  }
}

const serviceFiles = (await readdir(servicesDir)).filter((f) => f.endsWith('.md'));
const expected = serviceFiles.map((f) => f.replace(/\.md$/, ''));
if (expected.length !== 46) {
  errors.push(`expected 46 service markdown files, found ${expected.length}`);
}
for (const slug of expected) {
  const page = join(dist, 'services', slug, 'index.html');
  try {
    const s = await stat(page);
    if (!s.isFile()) errors.push(`missing service page: ${slug}`);
  } catch {
    errors.push(`missing service page: ${slug}`);
  }
}

const contact = await readFile(join(dist, 'contact', 'index.html'), 'utf8');
if (!/id="company-details"/.test(contact)) {
  errors.push('contact page is missing id="company-details"');
}
if (!/HeyDock is a trading name of/.test(contact)) {
  errors.push('contact page is missing the trading-name disclosure');
}

const required = [
  'index.html',
  'services/index.html',
  'industries/index.html',
  'resources/index.html',
  'about/index.html',
  'how-we-work/index.html',
  'careers/index.html',
  'contact/index.html',
  'coverage/index.html',
  'partners/index.html',
  'privacy/index.html',
  'cookies/index.html',
  'terms/index.html',
  'accessibility/index.html',
  'complaints/index.html',
  'documents/index.html',
  'support-and-escalation/index.html',
  'security-and-data-handling/index.html',
  'vendor-onboarding/index.html',
  'robots.txt',
  'llms.txt',
  '_redirects',
  '_headers',
];
for (const path of required) {
  try {
    await stat(join(dist, path));
  } catch {
    errors.push(`missing build output: ${path}`);
  }
}

if (errors.length) {
  console.error(`postbuild failed with ${errors.length} issue(s):`);
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}

console.log(`postbuild ok: ${htmlFiles.length} HTML files, ${expected.length} service pages, no .html links or breadcrumb bars.`);
