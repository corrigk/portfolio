// Single place for deployment settings. Change these when you get a custom domain.
export default {
  // Full origin of the deployed site (no trailing slash).
  site: process.env.SITE_URL || 'https://corrigk.github.io',
  // Sub-path. '/portfolio' for a GitHub *project* page (user.github.io/portfolio).
  // Use '' (empty) for a user page or a custom domain.
  base: process.env.SITE_BASE ?? '/portfolio',
  // Decorative motif: 'aircraft' (rotating B-1B, jet transitions) or 'space' (constellation, rockets).
  motif: 'aircraft',
  // Show every project on the Timeline page automatically (in addition to timeline entries).
  timelineIncludesProjects: true,
  // Privacy-friendly visit counts (no cookies). Create a free account at https://www.goatcounter.com,
  // then put your code here, e.g. 'corrigk' for https://corrigk.goatcounter.com. Empty = no analytics.
  goatcounter: process.env.GOATCOUNTER || '',
  // Order of category filters and home-page stats.
  categoryOrder: ['software', 'hardware', 'fun'],
};
