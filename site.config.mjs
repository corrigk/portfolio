// Single place for deployment settings. Change these when you get a custom domain.
export default {
  // Full origin of the deployed site (no trailing slash).
  site: process.env.SITE_URL || 'https://corrigk.github.io',
  // Sub-path. '/portfolio' for a GitHub *project* page (user.github.io/portfolio).
  // Use '' (empty) for a user page or a custom domain.
  base: process.env.SITE_BASE ?? '/portfolio',
  // Theme switcher: set to 'blueprint' | 'editorial' | 'playful' | 'purdue' to hide the switcher
  // and lock that theme. Leave null to show the switcher.
  // Can also be set at build time: LOCK_THEME=editorial npm run build
  lockTheme: process.env.LOCK_THEME || null,
};
