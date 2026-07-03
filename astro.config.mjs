// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Deployed to GitHub Pages as a project site. When the site moves to a
// custom domain (e.g. alexhartan.com), set `site` to that domain and
// remove `base`.
export default defineConfig({
  site: 'https://alexhartan.github.io',
  base: '/alexhartan',
  vite: {
    plugins: [tailwindcss()],
  },
});
