// Social-share image (1200x630 PNG) generated at build time from site settings.
import sharp from 'sharp';
import { site } from '../lib';

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);

function wrap(text: string, max = 40): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max) { out.push(line.trim()); line = w; } else line += ' ' + w;
  }
  if (line.trim()) out.push(line.trim());
  return out.slice(0, 3);
}

export async function GET() {
  const tag = wrap(site.tagline).map((l, i) => `<text x="80" y="${400 + i * 46}" font-size="34" fill="#bdb8ad">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#08080a"/>
  <g stroke="#ffffff" stroke-opacity=".05">${Array.from({ length: 25 }, (_, i) => `<path d="M${i * 50} 0V630"/>`).join('')}${Array.from({ length: 13 }, (_, i) => `<path d="M0 ${i * 50}H1200"/>`).join('')}</g>
  <rect width="1200" height="12" fill="#cfb991"/>
  <g fill="none" stroke="#cfb991"><circle cx="1040" cy="300" r="170" stroke-opacity=".25"/><circle cx="1040" cy="300" r="110" stroke-opacity=".3" stroke-dasharray="3 8"/>
  <ellipse cx="1040" cy="300" rx="210" ry="56" transform="rotate(-24 1040 300)" stroke-opacity=".6" stroke-width="2"/></g>
  <circle cx="1170" cy="222" r="8" fill="#daaa00"/>
  <text x="80" y="150" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="6" fill="#cfb991">PORTFOLIO</text>
  <text x="80" y="300" font-family="Arial Narrow, Arial, Helvetica, sans-serif" font-weight="700" font-size="104" fill="#f5f3ee">${esc(site.name.toUpperCase())}</text>
  <g font-family="Arial, Helvetica, sans-serif">${tag}</g>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
