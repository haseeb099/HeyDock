/** Shared enquiry validation and Resend delivery. No secrets are logged. */

export const LIMITS = Object.freeze({
  company: 150,
  name: 120,
  email: 180,
  location: 150,
  scopeMin: 15,
  scopeMax: 5000,
  timing: 80,
  budget: 80,
  service: 80,
  audience: 40,
  honeypot: 200,
});

export const AUDIENCES = Object.freeze(['business', 'partner']);

export const SERVICES = Object.freeze([
  'it-support',
  'engineer-dispatch',
  'remote-talent',
  'custom-software',
  'software',
  'ai-automation',
  'coverage',
  'managed-it-services',
  'microsoft-365',
  'network-wifi',
  'backup-disaster-recovery',
  'cybersecurity',
  'data-centre-support',
  'it-rollouts-migrations',
  'hardware-break-fix',
  'it-asset-disposal',
  'meeting-room-av',
  'business-connectivity-telephony',
  'it-consultancy',
]);

export const TIMINGS = Object.freeze([
  'Exploring options',
  'Within 2 weeks',
  'Within 1 month',
  'Within 3 months',
  'Specific date to discuss',
]);

export const BUDGETS = Object.freeze([
  'To be scoped',
  'Under £1,000',
  '£1,000–£5,000',
  '£5,000–£15,000',
  '£15,000+',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return String(value ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

/**
 * Validate enquiry payload. Returns {ok:true, data} or {ok:false, error, fields}.
 * Honeypot hits return ok:true with spam:true so the handler can fake success.
 */
export function validateEnquiry(raw) {
  const fields = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid enquiry payload.', fields: { body: 'Expected a JSON object.' } };
  }

  const honeypot = clean(raw.website, LIMITS.honeypot);
  if (honeypot) {
    return { ok: true, spam: true, data: null };
  }

  const audience = clean(raw.audience, LIMITS.audience);
  const service = clean(raw.service, LIMITS.service);
  const company = clean(raw.company, LIMITS.company);
  const name = clean(raw.name, LIMITS.name);
  const email = clean(raw.email, LIMITS.email).toLowerCase();
  const location = clean(raw.location, LIMITS.location);
  const timing = clean(raw.timing, LIMITS.timing);
  const budget = clean(raw.budget, LIMITS.budget);
  const scope = clean(raw.scope, LIMITS.scopeMax);
  const consent = raw.consent === true || raw.consent === 'on' || raw.consent === 'true' || raw.consent === '1';

  if (!AUDIENCES.includes(audience)) fields.audience = 'Choose a valid customer type.';
  if (!SERVICES.includes(service)) fields.service = 'Choose a valid service.';
  if (!company) fields.company = 'Company name is required.';
  if (!name) fields.name = 'Your name is required.';
  if (!email || !EMAIL_RE.test(email)) fields.email = 'Enter a valid business email.';
  if (!location) fields.location = 'Country or city is required.';
  if (!TIMINGS.includes(timing)) fields.timing = 'Choose a valid timing option.';
  if (!BUDGETS.includes(budget)) fields.budget = 'Choose a valid budget option.';
  if (scope.length < LIMITS.scopeMin) fields.scope = `Describe the work in at least ${LIMITS.scopeMin} characters.`;
  if (!consent) fields.consent = 'Confirm you agree to send this enquiry.';

  if (Object.keys(fields).length) {
    return { ok: false, error: 'Please correct the highlighted fields.', fields };
  }

  return {
    ok: true,
    spam: false,
    data: { audience, service, company, name, email, location, timing, budget, scope },
  };
}

export function formatEnquiryText(data) {
  const audienceLabel = data.audience === 'partner' ? 'IT company / partner' : 'Direct business';
  return [
    'HEYDOCK WEBSITE ENQUIRY',
    '',
    `Customer type: ${audienceLabel}`,
    `Company: ${data.company}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Service: ${data.service}`,
    `Location: ${data.location}`,
    `Timing: ${data.timing}`,
    `Budget indication: ${data.budget}`,
    '',
    'Requirements',
    data.scope,
    '',
    'Submitted via the HeyDock website enquiry form.',
  ].join('\n');
}

/**
 * Send via Resend. fetchImpl and env are injectable for tests.
 * Never logs message body, personal fields, or API keys.
 */
export async function sendEnquiryEmail(data, { env, fetchImpl = fetch } = {}) {
  const apiKey = String(env?.RESEND_API_KEY || '').trim();
  const from = String(env?.HEYDOCK_FROM_EMAIL || '').trim();
  const to = String(env?.HEYDOCK_TO_EMAIL || '').trim();

  if (!apiKey || !from || !to) {
    const err = new Error('Enquiry email is not configured.');
    err.code = 'CONFIG';
    err.status = 503;
    throw err;
  }

  const subject = `HeyDock enquiry · ${data.service} · ${data.company}`.slice(0, 180);
  const text = formatEnquiryText(data);
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'HeyDock-Enquiry/1.0',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: data.email,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const err = new Error('Email provider rejected the message.');
    err.code = 'PROVIDER';
    err.status = 502;
    throw err;
  }

  return { accepted: true };
}

/** Best-effort per-isolate rate limit for Cloudflare Pages Functions. */
export function createRateLimiter({ windowMs = 10 * 60 * 1000, max = 5 } = {}) {
  const hits = new Map();

  function prune(now) {
    for (const [key, times] of hits) {
      const next = times.filter((t) => now - t < windowMs);
      if (next.length) hits.set(key, next);
      else hits.delete(key);
    }
  }

  return {
    check(key) {
      const now = Date.now();
      prune(now);
      const times = hits.get(key) || [];
      if (times.length >= max) return { allowed: false, retryAfterSec: Math.ceil((windowMs - (now - times[0])) / 1000) };
      times.push(now);
      hits.set(key, times);
      return { allowed: true };
    },
    _hits: hits,
  };
}
