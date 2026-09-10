import { ObjectId } from "mongodb";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    createdAt: doc.createdAt?.toISOString?.() ?? "",
  };
}

export default async function CdDetailPage(
  props: PageProps<"/cd/[id]">
) {
  const { id } = await props.params;
  const cd = await getCd(id);

  if (!cd) {
    notFound();
  }

  let tracks: Track[] | null = null;
  if (cd.musicbrainzId) {
    try {
      tracks = await fetchTracklist(cd.musicbrainzId);
    } catch {
      tracks = null;
    }
  }

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
      <Link
        href="/"
        className="text-sm text-black/60 dark:text-white/60 hover:underline underline-offset-4"
      >
        ← Back to collection
      </Link>

      <div className="flex flex-col sm:flex-row gap-6 mt-4">
        <div className="w-full sm:w-56 shrink-0">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/10 relative">
            {cd.coverArtUrl ? (
              <Image
                src={cd.coverArtUrl}
                alt={`${cd.title} cover art`}
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/30 dark:text-white/30 text-6xl">
                💿
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 pt-1">
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
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-black/60 dark:text-white/60 mb-3">
          Track listing
        </h2>
        {tracks ? (
          <ol className="flex flex-col divide-y divide-black/10 dark:divide-white/10">
            {tracks.map((track) => (
              <li
                key={track.position}
                className="flex items-center gap-3 py-2 text-sm"
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
        ) : (
          <p className="text-sm text-black/50 dark:text-white/50">
            No track listing available for this release.
          </p>
        )}
      </div>
    </main>
  );
}
