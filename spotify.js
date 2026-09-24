// spotify.js
// Recherche de chansons via l'API officielle Spotify (Client Credentials Flow).
// Ne télécharge/redistribue jamais de morceau complet — uniquement l'extrait de
// 30s fourni par Spotify (quand disponible) et un lien vers l'écoute complète.

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const creds = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Échec authentification Spotify (${res.status})`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Cherche une chanson sur Spotify.
 * @param {string} query - titre et/ou artiste
 * @returns {Promise<{name: string, artist: string, previewUrl: string|null, spotifyUrl: string, albumArt: string|null} | null>}
 */
export async function searchTrack(query) {
  const token = await getAccessToken();

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) {
    throw new Error(`Échec recherche Spotify (${res.status})`);
  }

  const data = await res.json();
  const track = data.tracks?.items?.[0];
  if (!track) return null;

  return {
    name: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    previewUrl: track.preview_url || null, // souvent null, Spotify limite l'accès aux extraits
    spotifyUrl: track.external_urls.spotify,
    albumArt: track.album.images[0]?.url || null,
  };
}
