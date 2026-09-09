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

async function mbFetch(path: string): Promise<Response> {
  const res = await fetch(`https://musicbrainz.org/ws/2/${path}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });
  return res;
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
  const query = `artist:"${artist}" AND release:"${title}"`;
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
