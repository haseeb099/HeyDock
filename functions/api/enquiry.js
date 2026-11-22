/**
 * Cloudflare Pages Function: POST /api/enquiry
 * Secrets (Pages project env / wrangler secrets):
 *   RESEND_API_KEY, HEYDOCK_FROM_EMAIL, HEYDOCK_TO_EMAIL
 * Optional display email is build-time only: HEYDOCK_CONTACT_EMAIL
 */
import {
  validateEnquiry,
  sendEnquiryEmail,
  createRateLimiter,
} from '../_lib/enquiry.mjs';

const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

const corsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
};

function json(status, body, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders,
      ...extra,
    },
  });
}

function clientKey(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json(405, { error: 'Method not allowed.' }, { Allow: 'POST, OPTIONS' });
  }

  const rate = limiter.check(clientKey(request));
  if (!rate.allowed) {
    return json(
      429,
      { error: 'Too many enquiries from this network. Please try again later.' },
      { 'Retry-After': String(rate.retryAfterSec || 600) },
    );
  }

  let raw;
  try {
    const contentType = request.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      raw = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      raw = Object.fromEntries(form.entries());
    } else {
      raw = await request.json();
    }
  } catch {
    return json(400, { error: 'Could not read the enquiry payload.', fields: { body: 'Send JSON or form data.' } });
  }

  const result = validateEnquiry(raw);
  if (!result.ok) {
    return json(400, { error: result.error, fields: result.fields });
  }

  // Honeypot: pretend success without contacting the provider.
  if (result.spam) {
    return json(200, { ok: true });
  }

  try {
    await sendEnquiryEmail(result.data, { env, fetchImpl: fetch });
    return json(200, { ok: true });
  } catch (err) {
    const status = err?.status === 503 ? 503 : 502;
    const message =
      status === 503
        ? 'Enquiry delivery is not configured yet. Please try again later.'
        : 'We could not send your enquiry. Please try again.';
    // Do not log personal fields, scope text, or API keys.
    console.error('enquiry_send_failed', { code: err?.code || 'UNKNOWN', status });
    return json(status, { error: message });
  }
}
