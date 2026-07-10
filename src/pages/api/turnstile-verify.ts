import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const token = body?.token;

  if (!token) {
    return new Response(JSON.stringify({ success: false, error: 'missing token' }), { status: 400 });
  }

  const secretKey = env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return new Response(JSON.stringify({ success: false, error: 'server not configured' }), { status: 500 });
  }

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: secretKey, response: token }),
  });

  const data = await result.json();
  return new Response(JSON.stringify(data));
};
