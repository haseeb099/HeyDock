export const CATEGORIES = [
  { id: 'talent', name: 'Talent & staffing' },
  { id: 'managed', name: 'Managed IT & support' },
  { id: 'networks', name: 'Networks & infrastructure' },
  { id: 'cloud', name: 'Cloud' },
  { id: 'security', name: 'Cybersecurity & risk' },
  { id: 'software', name: 'AI, automation & software' },
  { id: 'consulting', name: 'Consulting & transformation' },
] as const;

export type CategoryName = (typeof CATEGORIES)[number]['name'];

export const INDUSTRY_ORDER = [
  'professional-services',
  'finance',
  'healthcare',
  'retail-hospitality',
  'public-sector',
  'managed-service-providers',
];
