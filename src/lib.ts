import cfg from '../site.config.mjs';
import site from './data/site.json';

export { site };
export const categoryOrder: string[] = cfg.categoryOrder || ['hardware', 'software', 'fun'];
export const base = (cfg.base || '').replace(/\/$/, '');

/** Prefix internal paths (e.g. "/uploads/a.jpg" or "/projects/") with the site base. External URLs pass through. */
export function url(p: string): string {
  if (!p) return p;
  if (/^(https?:|mailto:|data:|#)/.test(p)) return p;
  const path = p.startsWith('/') ? p : '/' + p;
  if (base && (path === base || path.startsWith(base + '/'))) return path;
  return base + path;
}

export function videoEmbed(link?: string): string | null {
  if (!link) return null;
  const yt = link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = link.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });
