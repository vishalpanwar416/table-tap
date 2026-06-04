/**
 * Theme registry — maps a restaurant's theme_id to a lazy-loaded customer frontend.
 *
 * Each theme is a complete, independent presentation layer that consumes
 * functionality only from `src/core`. The bundler emits one chunk per theme,
 * so a customer downloads only the theme their restaurant uses.
 *
 * Add a theme: build src/themes/theme-<id>/index.jsx (default export = its route
 * tree), then add one line here. No other file changes, no new deployment.
 */
export const THEMES = {
  a: () => import('./theme-a'),
};

/**
 * Human-facing catalog of selectable themes, in display order.
 * Keep one entry per key in THEMES — dashboards (manager/owner settings) render
 * from this list so a restaurant can pick which customer frontend it serves.
 * Adding a theme: add its loader to THEMES above + one entry here.
 */
export const THEME_OPTIONS = [
  {
    id: 'a',
    name: 'Classic',
    description: "Table Tap's default customer experience.",
  },
];

/** Resolve a theme loader, falling back to theme 'a' for unknown/missing ids. */
export const getThemeLoader = (themeId) => THEMES[themeId] || THEMES.a;

/** Resolve display metadata for a theme id, falling back to the first option. */
export const getThemeMeta = (themeId) =>
  THEME_OPTIONS.find((t) => t.id === themeId) || THEME_OPTIONS[0];
