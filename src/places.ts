// Build-time map geometry for the Places page. Runs in Node during `astro build`; ships only plain SVG.
import { geoNaturalEarth1, geoAlbersUsa, geoPath, geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import world110 from 'world-atlas/countries-110m.json';
import world50 from 'world-atlas/countries-50m.json';
import usAlbers from 'us-atlas/states-albers-10m.json';
import data from './data/places.json';

const ALIASES: Record<string, string> = {
  'united states': 'United States of America', usa: 'United States of America', us: 'United States of America', 'u.s.': 'United States of America',
  uk: 'United Kingdom', 'great britain': 'United Kingdom', england: 'United Kingdom', scotland: 'United Kingdom', wales: 'United Kingdom',
  'vatican city': 'Vatican', vatican: 'Vatican', holland: 'Netherlands', 'the netherlands': 'Netherlands',
  dc: 'District of Columbia', 'washington dc': 'District of Columbia', 'washington, d.c.': 'District of Columbia', 'd.c.': 'District of Columbia',
};
const canon = (n: string) => ALIASES[n.trim().toLowerCase()] ?? n.trim();

type Feat = { id?: string | number; properties: { name: string }; geometry: any };
const countries110 = (feature(world110 as any, (world110 as any).objects.countries) as any).features as Feat[];
const countries50 = (feature(world50 as any, (world50 as any).objects.countries) as any).features as Feat[];
const states = (feature(usAlbers as any, (usAlbers as any).objects.states) as any).features as Feat[];

const visitedCountries = new Set(data.countries.map((c) => canon(c.name)));
const visitedStates = new Set(data.states.map(canon));
const unmatched = [
  ...[...visitedCountries].filter((n) => !countries50.some((f) => f.properties.name === n)).map((n) => `country "${n}"`),
  ...[...visitedStates].filter((n) => !states.some((f) => f.properties.name === n)).map((n) => `state "${n}"`),
];
for (const u of unmatched) console.warn(`[places] ${u} was not found on the map (it will still be listed). Check the spelling in Places.`);

/* ---------- world ---------- */
const W = 960, H = 500;
const proj = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' } as any);
const path = geoPath(proj).digits(1);
const pathStr = (f: unknown) => path(f as any) ?? '';

export const worldBase = countries110.filter((f) => !visitedCountries.has(f.properties.name)).map((f) => pathStr(f)).filter(Boolean).join('');
export const worldVisited = countries50
  .filter((f) => visitedCountries.has(f.properties.name))
  .map((f) => {
    const b = path.bounds(f as any);
    const small = b[1][0] - b[0][0] < 7 && b[1][1] - b[0][1] < 7;
    const c = path.centroid(f as any);
    return { name: f.properties.name, d: pathStr(f), small, cx: c[0], cy: c[1] };
  });
export const worldOutline = pathStr({ type: 'Sphere' });
export const graticule = pathStr({ type: 'MultiLineString', coordinates: [-60, -30, 0, 30, 60].map((lat) => Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat])).concat([-120, -60, 0, 60, 120].map((lon) => Array.from({ length: 37 }, (_, i) => [lon, -90 + i * 5]))) });

const isUS = (c: { country: string }) => canon(c.country) === 'United States of America';
/** Pins for the world/Europe/Canada views. US cities appear only on the USA map, where they are readable. */
export const cities = data.cities
  .filter((c) => !isUS(c))
  .map((c) => {
    const p = proj([c.lon, c.lat]);
    return p ? { name: c.name, country: c.country, x: p[0], y: p[1] } : null;
  })
  .filter((c): c is { name: string; country: string; x: number; y: number } => !!c);

/** viewBox rectangles for the zoom presets, computed from lon/lat boxes. */
function box(lon0: number, lat0: number, lon1: number, lat1: number, pad = 0.04) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) {
    const p = proj([lon0 + ((lon1 - lon0) * i) / 12, lat0 + ((lat1 - lat0) * j) / 12])!;
    x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
  }
  let x = x0, y = y0, w = x1 - x0, h = y1 - y0;
  const ar = W / H; // keep the frame's aspect ratio
  if (w / h < ar) { const nw = h * ar; x -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y -= (nh - h) / 2; h = nh; }
  return [x - w * pad, y - h * pad, w * (1 + 2 * pad), h * (1 + 2 * pad)].map((n) => Math.round(n * 10) / 10);
}
export const views: Record<string, number[]> = {
  world: [0, 0, W, H],
  europe: box(-12, 36, 24, 60),
  canada: box(-132, 42, -60, 62),
  usa: [0, 0, W, H], // the USA tab swaps to the state map
};

/* ---------- USA ---------- */
const usPath = geoPath().digits(1);
export const usStates = states.map((f) => ({ name: f.properties.name, d: usPath(f as any) ?? '', visited: visitedStates.has(f.properties.name) }));

const usProj = geoAlbersUsa().scale(1300).translate([487.5, 305]);
export const usCities = data.cities
  .filter(isUS)
  .map((c) => {
    const p = usProj([c.lon, c.lat]);
    return p ? { name: c.name, x: p[0], y: p[1] } : null;
  })
  .filter((c): c is { name: string; x: number; y: number } => !!c);

/* ---------- summary ---------- */
const continentOf: Record<string, string> = {
  Germany: 'Europe', Austria: 'Europe', Switzerland: 'Europe', 'United Kingdom': 'Europe', Ireland: 'Europe', France: 'Europe', Italy: 'Europe',
  Netherlands: 'Europe', Vatican: 'Europe', Belgium: 'Europe', Denmark: 'Europe', Aruba: 'North America', Canada: 'North America', 'United States of America': 'North America',
};
export const summary = {
  countries: visitedCountries.size,
  states: visitedStates.size,
  stateNames: [...visitedStates].sort(),
  cities: data.cities.length,
  continents: new Set([...visitedCountries].map((c) => continentOf[c]).filter(Boolean)).size,
  countryList: data.countries,
  cityList: data.cities,
  cityGroups: Object.entries(data.cities.reduce((g: Record<string, string[]>, c) => ((g[c.country] ||= []).push(c.name), g), {})),
  unmatched,
};
export const dims = { W, H };
// geoCentroid is re-exported for potential callers that want label anchors
export { geoCentroid };
