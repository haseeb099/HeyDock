import siteJson from '../../content/site.json';

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined ? undefined : String(value).trim();
}

function pick(name: string, fallback: string): string {
  const value = readEnv(name);
  // An explicitly empty env var overrides the JSON fallback (used by the public-build disclosure check).
  return value === undefined ? fallback : value;
}

export type SiteConfig = {
  brand: string;
  origin: string;
  isPublic: boolean;
  operatorName: string;
  companyNumber: string;
  registeredOffice: string;
  registrationJurisdiction: string;
  vatNumber: string;
  contactEmail: string;
  contactPhone: string;
  contactPhoneHref: string;
};

export function getSiteConfig(): SiteConfig {
  const origin = pick('HEYDOCK_ORIGIN', 'https://hdocks.com').replace(/\/$/, '');
  const isPublic = readEnv('HEYDOCK_PUBLIC') === '1';

  const config: SiteConfig = {
    brand: 'HeyDock',
    origin,
    isPublic,
    operatorName: pick('HEYDOCK_OPERATOR_NAME', siteJson.operator_name),
    companyNumber: pick('HEYDOCK_COMPANY_NUMBER', siteJson.company_number),
    registeredOffice: pick('HEYDOCK_REGISTERED_OFFICE', siteJson.registered_office),
    registrationJurisdiction: pick(
      'HEYDOCK_REGISTRATION_JURISDICTION',
      siteJson.registration_jurisdiction,
    ),
    vatNumber: pick('HEYDOCK_VAT_NUMBER', siteJson.vat_number || ''),
    contactEmail: pick('HEYDOCK_CONTACT_EMAIL', siteJson.contact_email),
    contactPhone: pick('HEYDOCK_CONTACT_PHONE', siteJson.contact_phone),
    contactPhoneHref: `tel:${pick('HEYDOCK_CONTACT_PHONE', siteJson.contact_phone).replace(/\s+/g, '')}`,
  };

  if (isPublic) {
    const missing: string[] = [];
    if (!config.operatorName) missing.push('HEYDOCK_OPERATOR_NAME');
    if (!config.companyNumber) missing.push('HEYDOCK_COMPANY_NUMBER');
    if (!config.registeredOffice) missing.push('HEYDOCK_REGISTERED_OFFICE');
    if (!config.registrationJurisdiction) missing.push('HEYDOCK_REGISTRATION_JURISDICTION');
    if (!config.contactEmail) missing.push('HEYDOCK_CONTACT_EMAIL');
    if (!origin.startsWith('https://')) missing.push('HEYDOCK_ORIGIN (must be HTTPS)');
    if (/chatgpt\.site/i.test(origin)) missing.push('HEYDOCK_ORIGIN (preview host not allowed for public builds)');
    if (missing.length) {
      throw new Error(
        `Public build is missing required disclosures: ${missing.join(', ')}`,
      );
    }
  }

  return config;
}

export const site = getSiteConfig();
