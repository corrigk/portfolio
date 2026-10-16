import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { site, url } from '../lib';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

export async function GET(ctx: APIContext) {
  const abs = (p: string) => new URL(url(p), ctx.site).href;
  const items = (await getCollection('projects'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((p) => `<item><title>${esc(p.data.title)}</title><link>${abs(`/projects/${p.id}/`)}</link><guid>${abs(`/projects/${p.id}/`)}</guid><pubDate>${p.data.date.toUTCString()}</pubDate><description>${esc(p.data.summary)}</description><category>${p.data.category}</category></item>`)
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.name)} · Projects</title><link>${abs('/')}</link><description>${esc(site.tagline)}</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
