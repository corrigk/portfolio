import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(['hardware', 'software', 'fun']),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    date: z.coerce.date(),
    status: z.enum(['complete', 'in-progress', 'paused']).default('complete'),
    placeholder: z.boolean().default(false),
    cover: z.string(),
    coverAlt: z.string(),
    gallery: z.array(z.object({ image: z.string(), alt: z.string(), caption: z.string().optional() })).default([]),
    links: z.object({
      demo: z.string().optional(),
      repo: z.string().optional(),
      video: z.string().optional(),
      other: z.string().optional(),
    }).default({}),
    demo: z.object({
      url: z.string().optional(),
      folder: z.string().optional(),
      height: z.number().default(520),
    }).optional(),
    specs: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), intro: z.string().optional(), funTitle: z.string().optional(), funItems: z.array(z.string()).default([]) }),
});

export const collections = { projects, pages };
