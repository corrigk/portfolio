# Setting up CMS login (`/admin`)

Decap CMS saves changes by committing to this GitHub repo. GitHub Pages can't run the login handshake, so a tiny free Cloudflare Worker (`oauth-proxy/worker.js`) does that part.

> **Honesty note:** the worker and config follow Decap's documented OAuth flow, but they were written without being able to run a real GitHub login in this environment. Do step 5 (test) and tell me if anything fails.

Values used below: repo `corrigk/portfolio`, site `https://corrigk.github.io/portfolio/`.

## 1. Deploy the worker (do this first, you need its URL)

You need a free [Cloudflare](https://dash.cloudflare.com/sign-up) account.

```bash
cd oauth-proxy
npx wrangler login
npx wrangler deploy
```

Wrangler prints a URL like `https://portfolio-decap-oauth.<your-subdomain>.workers.dev`. Keep it.

`wrangler.toml` has `ALLOWED_ORIGIN = "https://corrigk.github.io"`. That is the *origin* only, with no `/portfolio`. Change it if your site's origin differs.

## 2. Create the GitHub OAuth App

GitHub → *Settings → Developer settings → OAuth Apps → New OAuth App*:

- Application name: anything (e.g. `Portfolio CMS`)
- Homepage URL: `https://corrigk.github.io/portfolio/`
- **Authorization callback URL:** `https://<your-worker-url>/callback`

Create it, then *Generate a new client secret*. Copy the Client ID and secret.

## 3. Give the worker its secrets

```bash
cd oauth-proxy
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

Paste each value when prompted. Never commit them.

## 4. Point the CMS at the worker

In `public/admin/config.yml` set:

```yaml
backend:
  base_url: https://<your-worker-url>
```

Commit and push. Wait for the Pages deploy to finish.

## 5. Add your friend and test

- Repo → *Settings → Collaborators → Add people*, enter their GitHub username, role **Write**. They must accept the email invitation. (They need a free GitHub account.)
- Open `https://corrigk.github.io/portfolio/admin/`, click **Login with GitHub**, approve. You should see Projects, Site Settings and Pages. Edit something small and press Publish; a commit appears and the site rebuilds in ~1 minute.

## Testing locally (no GitHub login)

```bash
npx decap-server        # terminal 1
npm run dev             # terminal 2
```
Open http://localhost:4321/portfolio/admin/ → it logs in automatically and edits local files.

## Troubleshooting

- **Popup says "Invalid or expired login attempt":** open the popup again; make sure browser cookies for the worker domain aren't blocked.
- **Login popup closes, nothing happens:** `ALLOWED_ORIGIN` must exactly match the site's origin (`https://corrigk.github.io`).
- **"Not Found" / 404 on save:** the person logging in has no write access to the repo.
- **Callback URL mismatch from GitHub:** the OAuth App callback must be exactly `https://<worker>/callback`.
- **Scopes:** the worker requests `repo,user` (needed to commit to a repo, including public ones, through Decap).
- Free tier limits (100k Worker requests/day) are far beyond what editing needs.

## Alternatives (not used)

Netlify Identity/Git Gateway or Decap's hosted options avoid running a worker but require leaving GitHub Pages or paying. I can switch if you'd rather.
