import type { APIRoute } from 'astro';

/**
 * Decap CMS GitHub OAuth callback.
 *
 * Flow:
 *   1. GET /api/oauth (no code) → 302 redirect to GitHub
 *   2. GitHub redirects back → GET /api/oauth?code=xxx
 *   3. Exchanges code for token, posts back to opener via postMessage
 *
 * Requires CF Worker secrets: GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
 */

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  const env: any =
    (locals as any)?.runtime?.env ??
    (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) ??
    {};

  const clientId: string | undefined = env.GITHUB_CLIENT_ID;
  const clientSecret: string | undefined = env.GITHUB_CLIENT_SECRET;
  const code = url.searchParams.get('code');
  const redirectUri = url.origin + '/api/oauth';

  // ----- Step 1: no code → redirect to GitHub ---------------------------------
  if (!code) {
    if (!clientId) {
      return new Response(
        body('❌ Missing GITHUB_CLIENT_ID secret', 'Run: wrangler secret put GITHUB_CLIENT_ID'),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
      );
    }
    const gh = new URL('https://github.com/login/oauth/authorize');
    gh.searchParams.set('client_id', clientId);
    gh.searchParams.set('scope', 'repo,user');
    gh.searchParams.set('redirect_uri', redirectUri);
    return new Response(null, { status: 302, headers: { Location: gh.toString() } });
  }

  // ----- Step 2: exchange code for token --------------------------------------
  if (!clientSecret) {
    return new Response(
      body('❌ Missing GITHUB_CLIENT_SECRET secret', 'Run: wrangler secret put GITHUB_CLIENT_SECRET'),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data: any = await tokenRes.json();

    if (data.error || !data.access_token) {
      return new Response(
        body('❌ Auth failed', data.error_description || data.error || 'Unknown error'),
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
      );
    }

    // Post token back to Decap CMS opener window
    const html = `<!DOCTYPE html>
<html><head><title>Signing in…</title></head><body>
<script>
(function(){
  var payload = ${JSON.stringify({ token: data.access_token, provider: 'github' })};
  if (window.opener) {
    window.opener.postMessage(payload, window.opener.location.origin);
    window.close();
  } else {
    document.body.innerHTML = '<p style="font-family:sans-serif;padding:2rem">✅ Authenticated — you may close this tab.</p>';
  }
})();
</script></body></html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (err: any) {
    return new Response(
      body('❌ Error', err.message),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
};

function body(title: string, detail: string) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem"><h1>${title}</h1><p>${detail}</p></body></html>`;
}
