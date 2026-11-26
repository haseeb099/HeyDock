import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { getSiteConfig } from './src/data/site.ts';

const site = getSiteConfig();

export default defineConfig({
  site: site.origin,
  trailingSlash: 'never',
  output: 'static',
  build: {
    format: 'directory',
    inlineStylesheets: 'never',
  },
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'monthly',
      lastmod: new Date(),
    }),
  ],
});
