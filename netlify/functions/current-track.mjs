// Netlify Function: returns an HTML fragment with the user's currently-playing
// Spotify track. Replaces the old Heroku Rails app at now.cesarchavez.io.
//
// Env vars (set in Netlify dashboard / .env for local dev):
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REFRESH_TOKEN

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const NOW_PLAYING_URL = "https://api.spotify.com/v1/me/player/currently-playing";

// Module-scope cache survives across warm invocations of the same function
// instance, so most requests skip the token refresh round-trip entirely.
let cached = null;

async function getAccessToken() {
  if (cached && Date.now() < cached.expiresAt - 60_000) {
    return cached.accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing SPOTIFY_* env vars");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cached = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cached.accessToken;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const responseHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=5",
};

export default async () => {
  try {
    const token = await getAccessToken();

    const res = await fetch(NOW_PLAYING_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 204) {
      return new Response("Not listening to anything right now...", {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (res.status === 401) {
      // Token revoked or scope changed — drop cache so next call refreshes.
      cached = null;
      return new Response("Unauthorized: Invalid or expired token", {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (!res.ok) {
      return new Response(`Spotify error: ${res.status}`, {
        status: 200,
        headers: responseHeaders,
      });
    }

    const data = await res.json();
    if (!data?.item) {
      return new Response("Not listening to anything right now...", {
        status: 200,
        headers: responseHeaders,
      });
    }

    const name = escapeHtml(data.item.name);
    const artists = escapeHtml(
      data.item.artists.map((a) => a.name).join(", "),
    );
    const songLink = escapeHtml(data.item.external_urls.spotify);

    const body =
      `<a style="text-decoration: none;" href="${songLink}" target="_blank">` +
      `<strong>${name}</strong> - ${artists}` +
      `</a>`;

    return new Response(body, { status: 200, headers: responseHeaders });
  } catch (e) {
    return new Response(escapeHtml(e?.message ?? "Error"), {
      status: 200,
      headers: responseHeaders,
    });
  }
};
