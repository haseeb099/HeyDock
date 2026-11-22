import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateEnquiry,
  sendEnquiryEmail,
  formatEnquiryText,
  createRateLimiter,
  SERVICES,
} from '../functions/_lib/enquiry.mjs';

const valid = {
  audience: 'business',
  service: 'engineer-dispatch',
  company: 'Example Trading Ltd',
  name: 'Alex Example',
  email: 'alex@example.com',
  location: 'Birmingham, UK',
  timing: 'Within 2 weeks',
  budget: 'To be scoped',
  scope: 'Need an on-site engineer for a desktop break/fix visit next week.',
  consent: true,
  website: '',
};

describe('validateEnquiry', () => {
  it('accepts a complete valid enquiry', () => {
    const result = validateEnquiry(valid);
    assert.equal(result.ok, true);
    assert.equal(result.spam, false);
    assert.equal(result.data.email, 'alex@example.com');
    assert.ok(SERVICES.includes(result.data.service));
  });

  it('rejects missing and short fields', () => {
    const result = validateEnquiry({ ...valid, company: '', scope: 'too short', email: 'not-an-email' });
    assert.equal(result.ok, false);
    assert.ok(result.fields.company);
    assert.ok(result.fields.scope);
    assert.ok(result.fields.email);
  });

  it('rejects invalid service and audience', () => {
    const result = validateEnquiry({ ...valid, service: 'not-real', audience: 'other' });
    assert.equal(result.ok, false);
    assert.ok(result.fields.service);
    assert.ok(result.fields.audience);
  });

  it('treats honeypot completion as spam without failing validation', () => {
    const result = validateEnquiry({ ...valid, website: 'http://spam.example' });
    assert.equal(result.ok, true);
    assert.equal(result.spam, true);
  });

  it('requires consent', () => {
    const result = validateEnquiry({ ...valid, consent: false });
    assert.equal(result.ok, false);
    assert.ok(result.fields.consent);
  });
});

describe('formatEnquiryText', () => {
  it('includes key fields and omits secrets', () => {
    const text = formatEnquiryText(validateEnquiry(valid).data);
    assert.match(text, /Example Trading Ltd/);
    assert.match(text, /engineer-dispatch/);
    assert.doesNotMatch(text, /RESEND|API_KEY|Bearer/i);
  });
});

describe('sendEnquiryEmail', () => {
  it('fails clearly when env is incomplete', async () => {
    await assert.rejects(
      () => sendEnquiryEmail(validateEnquiry(valid).data, { env: {}, fetchImpl: async () => {} }),
      (err) => err.code === 'CONFIG' && err.status === 503,
    );
  });

  it('posts to Resend and reports acceptance', async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url, init });
      return { ok: true, status: 200, json: async () => ({ id: 'test' }) };
    };
    const env = {
      RESEND_API_KEY: 're_test_key',
      HEYDOCK_FROM_EMAIL: 'HeyDock <hello@example.com>',
      HEYDOCK_TO_EMAIL: 'inbox@example.com',
    };
    const result = await sendEnquiryEmail(validateEnquiry(valid).data, { env, fetchImpl });
    assert.equal(result.accepted, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.resend.com/emails');
    assert.match(calls[0].init.headers.Authorization, /^Bearer re_test_key$/);
    const body = JSON.parse(calls[0].init.body);
    assert.deepEqual(body.to, ['inbox@example.com']);
    assert.equal(body.reply_to, 'alex@example.com');
    assert.match(body.text, /desktop break\/fix/);
    assert.equal(calls[0].init.body.includes('re_test_key'), false);
  });

  it('maps provider failure without exposing payload details', async () => {
    const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({ message: 'nope' }) });
    const env = {
      RESEND_API_KEY: 're_test_key',
      HEYDOCK_FROM_EMAIL: 'HeyDock <hello@example.com>',
      HEYDOCK_TO_EMAIL: 'inbox@example.com',
    };
    await assert.rejects(
      () => sendEnquiryEmail(validateEnquiry(valid).data, { env, fetchImpl }),
      (err) => err.code === 'PROVIDER' && err.status === 502 && !String(err.message).includes('alex@'),
    );
  });
});

describe('createRateLimiter', () => {
  it('allows a burst then blocks', () => {
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
    assert.equal(limiter.check('1.1.1.1').allowed, true);
    assert.equal(limiter.check('1.1.1.1').allowed, true);
    assert.equal(limiter.check('1.1.1.1').allowed, false);
    assert.equal(limiter.check('2.2.2.2').allowed, true);
  });
});

describe('retry path', () => {
  it('succeeds on a later attempt after provider failure', async () => {
    let attempts = 0;
    const fetchImpl = async () => {
      attempts += 1;
      if (attempts === 1) return { ok: false, status: 500 };
      return { ok: true, status: 200, json: async () => ({ id: 'ok' }) };
    };
    const env = {
      RESEND_API_KEY: 're_test_key',
      HEYDOCK_FROM_EMAIL: 'HeyDock <hello@example.com>',
      HEYDOCK_TO_EMAIL: 'inbox@example.com',
    };
    const data = validateEnquiry(valid).data;
    await assert.rejects(() => sendEnquiryEmail(data, { env, fetchImpl }));
    const second = await sendEnquiryEmail(data, { env, fetchImpl });
    assert.equal(second.accepted, true);
    assert.equal(attempts, 2);
  });
});
