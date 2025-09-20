# MyStore (Simple Storefront)

A minimal, mobile-first storefront that displays product listings and stock counts. Ordering is handled externally (e.g., messenger app).

Local dev

1. From the project root run a static server (Python example):

```powershell
python -m http.server 8000
```

2. Open http://localhost:8000 in your browser.

Node/npm (recommended)

1. Install dev dependencies once:

```powershell
npm install
```

2. Start a local static server on port 8000:

```powershell
npm start
```

3. Validate product JSON files:

```powershell
npm run validate-data
```

4. Optional scripts:

```powershell
# run a headless smoke test (requires server running on :8000)
npm run smoke

# convert hero JPGs to WebP (requires sharp)
npm run convert-webp
```

Notes

- Category pages (`category-all.html`, `category-food.html`, `category-school-supplies.html`) are templates that load product data from per-category JSON files in the `data/` directory (for example `data/food.json` and `data/school-supplies.json`).
- Homepage `index.html` still uses `js/main.js` to render the product grid and quick-view modal.
- To edit products, update the appropriate file under `data/` (e.g., `data/food.json`).

Netlify deployment
------------------

This project is a static site and can be deployed to Netlify with no build step. Recommended settings:

- Build command: `echo "No build; static site"` (or leave empty if you use the `netlify.toml` included in the repo)
- Publish directory: `.` (root of the repository)
- Environment: set `NODE_ENV=production` for install so devDependencies are skipped during the build

Notes and best practices for Netlify

- Dev-only tooling: this repo includes helper scripts that require native binaries (e.g., `sharp` and `puppeteer`). Keep those packages in `devDependencies` (they are already placed there). Do not run those scripts on Netlify builds.
  - Local helper scripts: `npm run convert-webp`, `npm run gen-hero`, and `npm run smoke` are intended for local use only (they require `sharp` or `puppeteer`).
- If you want automated smoke tests after deploy, run them in a CI workflow (GitHub Actions) or a dedicated job that can install devDependencies and run headless Chromium — do not run them in the Netlify build step.
- Static assets: confirm `images/` and `data/` are committed — Netlify will serve them directly.

Quick deploy checklist

1. Push your repo to GitHub (or connect your repo to Netlify).
2. In Netlify's site settings:
	- Set the build command to: `echo "No build; static site"` (or rely on `netlify.toml` included here).
	- Set the publish directory to: `.`
	- Add environment variable `NODE_ENV=production` to prevent installing devDependencies.
3. Deploy. After the site is live, verify pages:
	- `/` (index.html)
	- `/category-food.html`
	- `/category-school-supplies.html`
	- `/cart.html`

If you'd like, I can add a small GitHub Actions workflow that runs the smoke test after each push (it will install devDependencies and run headless Chromium); tell me and I'll scaffold it.
