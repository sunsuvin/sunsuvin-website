# Sunsuvin — Eleventy + Decap CMS Deployment Guide

This replaces the old flat-HTML site with a build-based one. Read this fully before
starting — the OAuth setup (Part 2) is the fiddly part and easy to get wrong on the first try.

## Before you start: carry over your working GAS endpoint

`src/assets/script.js` in this package still has the placeholder endpoint:
```js
const SUNSUVIN_ENDPOINT = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```
Your actual deployed `/exec` URL from earlier only exists in your own copy of the old
`script.js`, not here. **Before deploying, paste your real URL into this file** — otherwise
the contact form will silently show "backend not connected yet" again.

## Part 1 — Push the Eleventy project to GitHub

1. Create a new GitHub repo (e.g. `sunsuvin-website`). This **replaces** whatever repo you
   may have already created for the old flat-HTML version — this project has a different
   structure (`src/`, a build step, `admin/`).
2. Push everything in this package — `src/`, `admin/`, `eleventy.config.js`, `package.json`
   — to that repo. Do not push `node_modules` or `_site` (build artifacts, regenerated
   automatically).
3. Locally, confirm it builds before pushing if you can: `npm install` then `npm run build`
   — should produce a `_site` folder with 5 HTML pages.

## Part 2 — Set up GitHub OAuth (so you can log into /admin)

Decap CMS needs a real login, not a shared password. This requires a GitHub OAuth App
plus the small Cloudflare Worker included in `oauth-worker/`.

1. Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Fill in:
   - **Application name**: `Sunsuvin CMS`
   - **Homepage URL**: your site's URL (e.g. `https://sunsuvin.pages.dev`)
   - **Authorization callback URL**: `https://sunsuvin-cms-auth.YOUR-SUBDOMAIN.workers.dev/callback`
     (you'll get this exact URL in step 5 below — come back and fill it in after deploying
     the Worker, or use a placeholder now and edit it later in the OAuth App settings)
3. Click **Register application**. Copy the **Client ID**, then click **Generate a new
   client secret** and copy that too — you won't be able to see the secret again.
4. Install the Cloudflare CLI if you don't have it: `npm install -g wrangler`
5. In the `oauth-worker/` folder from this package, run:
   ```
   wrangler login
   wrangler deploy
   ```
   This prints your Worker's live URL, e.g. `https://sunsuvin-cms-auth.your-name.workers.dev`.
   Go back to your GitHub OAuth App settings and make sure the callback URL matches this
   exactly, ending in `/callback`.
6. Set your secrets (never commit these to the repo):
   ```
   wrangler secret put GITHUB_CLIENT_ID
   wrangler secret put GITHUB_CLIENT_SECRET
   ```
   Paste the values from step 3 when prompted.

## Part 3 — Point the CMS config at your real repo and worker

1. Open `admin/config.yml` in this package.
2. Replace:
   ```yaml
   repo: YOUR_GITHUB_USERNAME/sunsuvin-website
   base_url: https://YOUR-OAUTH-WORKER.workers.dev
   ```
   with your actual GitHub username/repo and the Worker URL from Part 2, step 5
   (no trailing `/callback` here — just the base Worker URL).
3. Commit and push this change.

## Part 4 — Deploy the site to Cloudflare Pages

1. In Cloudflare Pages, create a project connected to this repo (same flow as before).
2. Build settings this time are different from the flat-HTML version — there's now a real
   build step:
   - **Framework preset**: None
   - **Build command**: `npm run build`
   - **Build output directory**: `_site`
3. Deploy. Cloudflare will run `npm install` and `npm run build` automatically on every
   push.

## Part 5 — Test it end to end

1. Visit your deployed site's 5 pages — confirm they look identical to the old version.
2. Visit `/admin` on your deployed site (e.g. `https://sunsuvin.pages.dev/admin`).
3. Click **Login with GitHub**. You should be redirected through GitHub, then back into
   the CMS editor showing collections: Home page, About page, Services page, Products
   page, Contact page, Site-wide settings.
4. Edit one field (e.g. the home page hero headline), click **Publish**. This commits
   directly to your GitHub repo's main branch.
5. Wait ~30-60 seconds for Cloudflare Pages to rebuild, then refresh your live site and
   confirm the change appears.
6. Submit the contact form again on the live site to reconfirm the GAS backend still
   works after the migration (Part 1's endpoint carryover).

## What's intentionally NOT editable via the CMS

The nav structure's link order, the journey motif's SVG path, and the overall page layout
stay in the `.njk` templates — only the fields defined in `admin/config.yml` are editable.
This is deliberate: it keeps a non-technical editor from accidentally breaking the page
structure while still giving full control over every headline, paragraph, and card.

## Known limitation worth knowing

The Services page's "Journey steps" list is wired to a diagram drawn for exactly 3 steps
(the connecting line has 3 fixed points). If you add or remove a step via the CMS, the
diagram won't resize to match — it'll still show 3 dots regardless of how many steps you
enter. Keep it at 3, or tell me and I'll rebuild the diagram to scale with the list.
