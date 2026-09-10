// MusicBrainz asks that clients identify themselves with an app name/version
// and a contact URL/email. Set MUSICBRAINZ_CONTACT to your own contact info
// if you plan to make heavy use of the API.
const USER_AGENT = `CD-Manager/1.0 (${
  process.env.MUSICBRAINZ_CONTACT || "https://github.com/"
})`;

interface MusicBrainzRelease {
  id: string;
  title: string;
  date?: string;
  "track-count"?: number;
  "artist-credit"?: { name: string }[];
  "release-group"?: { id: string };
}

interface MusicBrainzSearchResponse {
  releases?: MusicBrainzRelease[];
}

export interface AlbumMetadata {
  artist: string;
  title: string;
  year: number | null;
  trackCount: number | null;
  coverArtUrl: string | null;
  musicbrainzId: string | null;
}

// MusicBrainz enforces a ~1 req/sec rate limit per source IP. On Vercel,
// serverless functions share IP ranges with countless other deployments
// also calling MusicBrainz, so a 503 here doesn't mean *we* went over the
// limit — it can happen even on a single, first-ever request. Retry once
// after a short backoff (honoring Retry-After when present) before giving up.
async function mbFetch(path: string): Promise<Response> {
  const url = `https://musicbrainz.org/ws/2/${path}`;
  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
  };

  const res = await fetch(url, { headers });
  if (res.status !== 503) {
    return res;
  }

  const retryAfterSeconds = parseInt(res.headers.get("retry-after") || "", 10);
  const delayMs = Number.isFinite(retryAfterSeconds)
    ? Math.min(retryAfterSeconds * 1000, 3000)
    : 1000;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  return fetch(url, { headers });
}

/**
 * Looks up an album by artist + title on MusicBrainz and returns the best
 * matching metadata, including a Cover Art Archive thumbnail URL when one
 * is available. Returns null if no match is found.
 */
export async function fetchAlbumMetadata(
  artist: string,
  title: string
): Promise<AlbumMetadata | null> {
  // Escape Lucene special characters so titles/artists containing quotes
  // (e.g. `"Weird Al"`) don't break the query syntax.
  const escape = (s: string) => s.replace(/["\\]/g, "\\$&");
  const query = `artist:"${escape(artist)}" AND release:"${escape(title)}"`;
  const res = await mbFetch(
    `release/?query=${encodeURIComponent(query)}&fmt=json&limit=5`
  );

  if (!res.ok) {
    throw new Error(`MusicBrainz search failed (${res.status})`);
  }

  const data: MusicBrainzSearchResponse = await res.json();
  const best = data.releases?.[0];

  if (!best) {
    return null;
  }

  const releaseGroupId = best["release-group"]?.id ?? null;

  return {
    artist: best["artist-credit"]?.[0]?.name ?? artist,
    title: best.title,
    year: best.date ? parseInt(best.date.slice(0, 4), 10) || null : null,
    trackCount: best["track-count"] ?? null,
    musicbrainzId: best.id,
    coverArtUrl: releaseGroupId
      ? `https://coverartarchive.org/release-group/${releaseGroupId}/front-250`
      : null,
  };
}

interface MusicBrainzTrack {
  position: number;
  title: string;
  length?: number | null;
}

interface MusicBrainzMedium {
  format?: string;
  tracks?: MusicBrainzTrack[];
}

interface MusicBrainzReleaseDetail {
  media?: MusicBrainzMedium[];
}

export interface Track {
  position: number;
  title: string;
  lengthMs: number | null;
}

/**
 * Fetches the track listing for a release. Returns null if the release
 * can't be found or has no track data.
 */
export async function fetchTracklist(
  releaseMbid: string
): Promise<Track[] | null> {
  const res = await mbFetch(`release/${releaseMbid}?inc=recordings&fmt=json`);

  if (!res.ok) {
    return null;
  }

  const data: MusicBrainzReleaseDetail = await res.json();
  const tracks = data.media?.flatMap((medium) => medium.tracks ?? []) ?? [];

  if (tracks.length === 0) {
    return null;
  }

  return tracks.map((t) => ({
    position: t.position,
    title: t.title,
    lengthMs: t.length ?? null,
  }));
}
