import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICES } from '../functions/_lib/enquiry.mjs';
import { REDIRECTS } from '../functions/_lib/redirects.mjs';

const root = new URL('..', import.meta.url);
const dist = join(root.pathname, 'dist');
const servicesDir = join(root.pathname, 'src/content/services');

const EXPECTED_SERVICES = [
  'it-staffing-recruitment',
  'remote-global-staff-recruitment',
  'technical-staff',
  'non-technical-staff',
  'staffing',
  'remote-technical-talent',
  'managed-it-services',
  'it-support',
  'helpdesk-end-user-support',
  'chat-support',
  'engineer-dispatch',
  'hardware-break-fix',
  'infrastructure-monitoring',
  'network-support',
  'network-wifi',
  'business-connectivity-telephony',
  'data-centre-support',
  'meeting-room-av',
  'it-rollouts-migrations',
  'it-asset-disposal',
  'cloud-solutions',
  'cloud-management-support',
  'cloud-migration',
  'devops-cicd',
  'finops-cloud-cost',
  'microsoft-365',
  'cybersecurity',
  'vulnerability-assessment-penetration-testing',
  'security-operations-soc',
  'incident-response-forensics',
  'compliance-support',
  'zero-trust-architecture',
  'security-awareness-training',
  'social-engineering-awareness',
  'ai-phishing-defence',
  'ai-automation',
  'custom-software',
  'business-software',
  'it-consulting',
  'digital-transformation',
  'it-architecture',
  'vendor-selection',
  'it-cost-optimisation',
  'business-continuity-disaster-recovery',
  'post-merger-it-integration',
  'it-consultancy-site-surveys',
];

describe('service catalogue', () => {
  it('has all 46 master-list services as content files and enquiry allowlist entries', async () => {
    const files = (await readdir(servicesDir)).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')).sort();
    assert.deepEqual(files, [...EXPECTED_SERVICES].sort());
    assert.equal(files.length, 46);
    for (const slug of EXPECTED_SERVICES) {
      assert.ok(SERVICES.includes(slug), `SERVICES missing ${slug}`);
    }
    for (const alias of ['coverage', 'remote-talent', 'software', 'backup-disaster-recovery', 'it-consultancy']) {
      assert.ok(SERVICES.includes(alias), `SERVICES missing alias ${alias}`);
    }
  });
});

describe('legacy redirects', () => {
  it('maps every previous .html URL and old root service slug', () => {
    const from = new Set(REDIRECTS.map(([a]) => a));
    const required = [
      '/services.html',
      '/it-support.html',
      '/it-support',
      '/remote-talent.html',
      '/software.html',
      '/backup-disaster-recovery.html',
      '/it-consultancy.html',
      '/contact.html',
      '/about.html',
      '/privacy.html',
    ];
    for (const path of required) {
      assert.ok(from.has(path), `missing redirect for ${path}`);
    }
  });
});

describe('built site', () => {
  it('has been built (dist exists) with clean URLs and no breadcrumb bar', async () => {
    assert.ok(existsSync(dist), 'dist/ is missing — run npm run build first');
    for (const slug of EXPECTED_SERVICES) {
      const page = join(dist, 'services', slug, 'index.html');
      const s = await stat(page);
      assert.ok(s.isFile(), `missing ${slug}`);
      const html = await readFile(page, 'utf8');
      assert.equal(html.includes('href="') && /\b(?:href|src)=["'][^"']+\.html/i.test(html), false, `${slug} has a .html link`);
      const body = html.split(/<body/i)[1] || '';
      assert.equal(/\bclass=["'][^"']*\bbreadcrumb/i.test(body), false, `${slug} has a visible breadcrumb`);
    }
    const contact = await readFile(join(dist, 'contact', 'index.html'), 'utf8');
    assert.match(contact, /id="company-details"/);
    assert.match(contact, /HeyDock is a trading name of/);
  });
});
