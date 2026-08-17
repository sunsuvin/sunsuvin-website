/**
 * SUNSUVIN — Decap CMS GitHub OAuth proxy
 * -----------------------------------------------------------
 * Decap CMS's "github" backend needs a server to run the OAuth
 * handshake (it can't hold a client secret in the browser). This
 * Worker is that server. It does two things:
 *
 *   GET /auth      -> redirects the editor to GitHub's login page
 *   GET /callback  -> exchanges the code for a token, hands it
 *                     back to the CMS popup window
 *
 * Required secrets (set via `wrangler secret put`, never hardcoded):
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
      authorizeUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authorizeUrl.searchParams.set('redirect_uri', `${url.origin}/callback`);
      authorizeUrl.searchParams.set('scope', 'repo,user');
      authorizeUrl.searchParams.set('state', crypto.randomUUID());
      return Response.redirect(authorizeUrl.toString(), 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('Missing code from GitHub', { status: 400 });
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
      });

      const tokenData = await tokenRes.json();

      if (tokenData.error) {
        return new Response(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`, { status: 400 });
      }

      const token = tokenData.access_token;

      // Hand the token back to the Decap CMS popup via postMessage,
      // following Decap's documented handshake protocol.
      const html = `<!doctype html>
<html><body>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:github:success:' + JSON.stringify({ token: '${token}', provider: 'github' }),
        e.origin
      );
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
Login successful, this window should close automatically.
</body></html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response('Sunsuvin CMS auth proxy is running. Visit /auth to start login.', { status: 200 });
  }
};
