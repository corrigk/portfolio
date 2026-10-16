// Minimal GitHub OAuth proxy for Decap CMS, for Cloudflare Workers.
// Routes:  GET /auth      -> redirects to GitHub's authorize page
//          GET /callback  -> exchanges the code for a token and hands it to Decap via postMessage
// Secrets (set with `wrangler secret put`): GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
// Plain var (wrangler.toml): ALLOWED_ORIGIN, e.g. https://corrigk.github.io

const AUTHORIZE = 'https://github.com/login/oauth/authorize';
const TOKEN = 'https://github.com/login/oauth/access_token';

function page(status, content, origin) {
  // Decap's popup handshake: reply to "authorizing:github", then send the result.
  const msg = `authorization:github:${status}:${JSON.stringify(content)}`;
  const html = `<!doctype html><meta charset="utf-8"><body><script>
  (function () {
    var target = ${JSON.stringify(origin)};
    function receive(e) {
      if (e.origin !== target) return;
      window.opener.postMessage(${JSON.stringify(msg)}, e.origin);
      window.removeEventListener('message', receive, false);
      setTimeout(function () { window.close(); }, 100);
    }
    window.addEventListener('message', receive, false);
    window.opener.postMessage('authorizing:github', target);
  })();
  </script><p>Signing you in…</p></body>`;
  return new Response(html, { headers: { 'content-type': 'text/html;charset=UTF-8' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN;

    if (url.pathname === '/auth') {
      const state = crypto.randomUUID();
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope: url.searchParams.get('scope') || 'repo,user',
        state,
        redirect_uri: `${url.origin}/callback`,
      });
      return new Response(null, {
        status: 302,
        headers: {
          Location: `${AUTHORIZE}?${params}`,
          'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        },
      });
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const cookie = (request.headers.get('Cookie') || '').match(/oauth_state=([^;]+)/);
      if (!code || !state || !cookie || cookie[1] !== state) {
        return page('error', { message: 'Invalid or expired login attempt. Close this window and try again.' }, origin);
      }
      const res = await fetch(TOKEN, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json', 'user-agent': 'decap-oauth-proxy' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });
      const data = await res.json();
      if (data.error || !data.access_token) {
        return page('error', { message: data.error_description || data.error || 'GitHub did not return a token.' }, origin);
      }
      return page('success', { token: data.access_token, provider: 'github' }, origin);
    }

    return new Response('Decap OAuth proxy is running.', { status: 200 });
  },
};
