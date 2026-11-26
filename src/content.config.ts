import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const faq = z.object({ q: z.string(), a: z.string() });
const step = z.object({ title: z.string(), text: z.string() });

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    h1: z.string(),
    description: z.string().max(170),
    category: z.string(),
    summary: z.string(),
    keywords: z.string(),
    includes: z.array(z.string()),
    audience: z.array(z.string()),
    process: z.array(step),
    faqs: z.array(faq).min(3),
    related: z.array(z.string()),
    order: z.number(),
  }),
});

const industries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/industries' }),
  schema: z.object({
    title: z.string(),
    h1: z.string(),
    description: z.string().max(170),
    summary: z.string(),
    keywords: z.string(),
    services: z.array(z.string()),
    faqs: z.array(faq).min(3),
    order: z.number(),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/resources' }),
  schema: z.object({
    title: z.string(),
    h1: z.string(),
    description: z.string().max(170),
    summary: z.string(),
    keywords: z.string(),
    date: z.string(),
    faqs: z.array(faq).optional(),
    relatedServices: z.array(z.string()).optional(),
    order: z.number(),
  }),
});

export const collections = { services, industries, resources };
