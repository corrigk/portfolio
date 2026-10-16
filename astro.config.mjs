import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cfg from './site.config.mjs';

export default defineConfig({
  site: cfg.site,
  base: cfg.base || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
