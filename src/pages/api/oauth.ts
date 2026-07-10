/**
 * Decap CMS GitHub OAuth callback endpoint.
 *
 * Flow:
 * 1. Decap CMS opens popup → /api/oauth?provider=github
 * 2. This endpoint redirects to GitHub for authorization
 * 3. GitHub redirects back → /api/oauth?code=xxx
 * 4. This endpoint exchanges the code for an access token
 * 5. Token is posted back to the Decap CMS window via postMessage
 *
 * Requires Cloudflare Worker secrets:
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 * Set them via: wrangler secret put GITHUB_CLIENT_ID
 *              wrangler secret put GITHUB_CLIENT_SECRET
 */

interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export const GET = async ({ url, locals }: any) => {
  const env: Env = (locals?.runtime?.env) || {};

  const clientId = env.GITHUB_CLIENT_ID;
  const clientSecret = env.GITHUB_CLIENT_SECRET;
  const code = url.searchParams.get("code");

  // Build the redirect URI (same as this endpoint)
  const redirectUri = url.origin + "/api/oauth";

  // --- Step 1: no code → redirect user to GitHub for authorization ---
  if (!code) {
    if (!clientId) {
      return new Response(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
          <h1>Configuration Missing</h1>
          <p>GITHUB_CLIENT_ID is not set. Add it via:</p>
          <pre>wrangler secret put GITHUB_CLIENT_ID</pre>
        </body></html>`,
        {
          status: 500,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    const githubAuthUrl =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&scope=${encodeURIComponent("repo,user")}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return new Response(null, {
      status: 302,
      headers: { Location: githubAuthUrl },
    });
  }

  // --- Step 2: exchange code for access token ---
  if (!clientSecret) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
        <h1>Configuration Missing</h1>
        <p>GITHUB_CLIENT_SECRET is not set. Add it via:</p>
        <pre>wrangler secret put GITHUB_CLIENT_SECRET</pre>
      </body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      }
    );

    const tokenData: any = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      return new Response(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
          <h1>Authentication Failed</h1>
          <p>${tokenData.error_description || tokenData.error || "Unknown error"}</p>
        </body></html>`,
        {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }

    // --- Step 3: send token back to Decap CMS opener window ---
    const payload = JSON.stringify({
      token: tokenData.access_token,
      provider: "github",
    });

    const html = `<!DOCTYPE html>
<html><head><title>Signing in…</title></head>
<body>
<script>
  (function() {
    if (window.opener) {
      window.opener.postMessage(${payload}, window.opener.location.origin);
      window.close();
    } else {
      document.body.innerHTML = '<p style="font-family:sans-serif;padding:2rem">✅ Authenticated — you may close this tab.</p>';
    }
  })();
</script>
</body></html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    return new Response(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem">
        <h1>Error</h1>
        <p>Failed to exchange token: ${err.message}</p>
      </body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
};
