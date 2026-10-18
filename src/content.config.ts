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
    model: z.string().optional(), // .glb file shown in an interactive 3D viewer
    specSheet: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), intro: z.string().optional(), funTitle: z.string().optional(), funItems: z.array(z.string()).default([]) }),
});

const timeline = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/timeline' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['work', 'education', 'home', 'team', 'milestone', 'idea', 'project']),
    date: z.coerce.date().optional(),   // start date; ideas may leave it empty
    yearOnly: z.boolean().default(false), // show "2009" instead of "2009.01" when the month is unknown
    end: z.coerce.date().optional(),
    ongoing: z.boolean().default(false),
    place: z.string().optional(),
    link: z.string().optional(),
    placeholder: z.boolean().default(false),
  }),
});

export const collections = { projects, pages, timeline };
