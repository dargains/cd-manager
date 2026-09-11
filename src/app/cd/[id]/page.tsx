import { ObjectId } from "mongodb";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getDb } from "@/lib/mongodb";
import { fetchTracklist, type Track } from "@/lib/musicbrainz";
import type { Cd } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function getCd(id: string): Promise<Cd | null> {
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const db = await getDb();
  const doc = await db.collection("cds").findOne({ _id: objectId });
  if (!doc) return null;

  return {
    _id: doc._id.toString(),
    artist: doc.artist,
    title: doc.title,
    year: doc.year ?? null,
    trackCount: doc.trackCount ?? null,
    coverArtUrl: doc.coverArtUrl ?? null,
    musicbrainzId: doc.musicbrainzId ?? null,
    genres: doc.genres ?? [],
    createdAt: doc.createdAt?.toISOString?.() ?? "",
  };
}

async function getRelatedCds(cd: Cd): Promise<Cd[]> {
  if (cd.genres.length === 0) return [];

  const db = await getDb();
  const docs = await db
    .collection("cds")
    .find({
      _id: { $ne: new ObjectId(cd._id) },
      genres: { $in: cd.genres },
    })
    .sort({ artist: 1, title: 1 })
    .limit(8)
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toString(),
    artist: doc.artist,
    title: doc.title,
    year: doc.year ?? null,
    trackCount: doc.trackCount ?? null,
    coverArtUrl: doc.coverArtUrl ?? null,
    musicbrainzId: doc.musicbrainzId ?? null,
    genres: doc.genres ?? [],
    createdAt: doc.createdAt?.toISOString?.() ?? "",
  }));
}

async function TrackListing({ musicbrainzId }: { musicbrainzId: string | null }) {
  let tracks: Track[] | null = null;
  if (musicbrainzId) {
    try {
      tracks = await fetchTracklist(musicbrainzId);
    } catch {
      tracks = null;
    }
  }

  if (!tracks) {
    return (
      <p className="text-sm text-black/50 dark:text-white/50">
        No track listing available for this release.
      </p>
    );
  }

  return (
    <ol className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
      {tracks.map((track) => (
        <li
          key={track.position}
          className="flex items-center gap-3 py-2 text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors rounded-md px-2 -mx-2"
        >
          <span className="text-black/40 dark:text-white/40 w-5 text-right shrink-0">
            {track.position}
          </span>
          <span className="flex-1 truncate">{track.title}</span>
          {track.lengthMs !== null && (
            <span className="text-black/50 dark:text-white/50 shrink-0">
              {formatDuration(track.lengthMs)}
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function TrackListingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-5 w-full rounded bg-black/10 dark:bg-white/10 animate-pulse"
        />
      ))}
    </div>
  );
}

export default async function CdDetailPage(
  props: PageProps<"/cd/[id]">
) {
  const { id } = await props.params;
  const cd = await getCd(id);

  if (!cd) {
    notFound();
  }

  const relatedCds = await getRelatedCds(cd);

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
      <Link
        href="/"
        className="text-sm text-black/60 dark:text-white/60 hover:underline hover:text-foreground underline-offset-4 transition-colors"
      >
        ← Back to collection
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 mt-4">
        <div className="w-full sm:w-56 shrink-0">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/10 relative">
            {cd.coverArtUrl ? (
              <ViewTransition
                name={`cover-${cd._id}`}
                share="morph"
                default="none"
              >
                <Image
                  src={cd.coverArtUrl}
                  alt={`${cd.title} cover art`}
                  fill
                  sizes="(max-width: 640px) 100vw, 224px"
                  className="object-cover"
                  unoptimized
                />
              </ViewTransition>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/30 dark:text-white/30 text-6xl">
                💿
              </div>
            )}
          </div>
        </div>

        <div
          className="flex flex-col gap-1 pt-1 animate-in"
          style={{ "--delay": "80ms" } as React.CSSProperties}
        >
          <h1 className="text-2xl font-semibold leading-tight">{cd.title}</h1>
          <p className="text-lg text-black/70 dark:text-white/70">
            {cd.artist}
          </p>
          <p className="text-sm text-black/50 dark:text-white/50 mt-1">
            {[
              cd.year,
              cd.trackCount
                ? `${cd.trackCount} track${cd.trackCount === 1 ? "" : "s"}`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {cd.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {cd.genres.map((genre, i) => (
                <span
                  key={genre}
                  className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs text-black/70 dark:text-white/70 capitalize animate-in hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
                  style={{ "--delay": `${140 + i * 40}ms` } as React.CSSProperties}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="mt-10 animate-in"
        style={{ "--delay": "160ms" } as React.CSSProperties}
      >
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">
          Track listing
        </h2>
        <Suspense fallback={<TrackListingSkeleton />}>
          <TrackListing musicbrainzId={cd.musicbrainzId} />
        </Suspense>
      </div>

      {relatedCds.length > 0 && (
        <div
          className="mt-10 animate-in"
          style={{ "--delay": "220ms" } as React.CSSProperties}
        >
          <h2 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">
            Related albums
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {relatedCds.map((related, i) => (
              <Link
                key={related._id}
                href={`/cd/${related._id}`}
                className="group flex flex-col gap-2 animate-in"
                style={{ "--delay": `${260 + i * 30}ms` } as React.CSSProperties}
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/10 relative transition-shadow duration-300 group-hover:shadow-lg">
                  {related.coverArtUrl ? (
                    <ViewTransition
                      name={`cover-${related._id}`}
                      share="morph"
                      default="none"
                    >
                      <Image
                        src={related.coverArtUrl}
                        alt={`${related.title} cover art`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                      />
                    </ViewTransition>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/30 dark:text-white/30 text-4xl transition-transform duration-300 group-hover:scale-105">
                      💿
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm leading-tight truncate">
                    {related.title}
                  </p>
                  <p className="text-sm text-black/60 dark:text-white/60 truncate">
                    {related.artist}
                    {related.year ? ` · ${related.year}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
