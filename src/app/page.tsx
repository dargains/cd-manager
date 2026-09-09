import Image from "next/image";
import Link from "next/link";
import { getDb } from "@/lib/mongodb";
import type { Cd } from "@/lib/types";
import { deleteCd } from "./actions";

export const dynamic = "force-dynamic";

async function getCds(): Promise<Cd[]> {
  const db = await getDb();
  const docs = await db
    .collection("cds")
    .find({})
    .sort({ artist: 1, title: 1 })
    .toArray();

  return docs.map((doc) => ({
    _id: doc._id.toString(),
    artist: doc.artist,
    title: doc.title,
    year: doc.year ?? null,
    trackCount: doc.trackCount ?? null,
    coverArtUrl: doc.coverArtUrl ?? null,
    musicbrainzId: doc.musicbrainzId ?? null,
    createdAt: doc.createdAt?.toISOString?.() ?? "",
  }));
}

export default async function Home() {
  const cds = await getCds();

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">My CD Collection</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {cds.length} {cds.length === 1 ? "album" : "albums"}
          </p>
        </div>
        <Link
          href="/add"
          className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Add CD
        </Link>
      </div>

      {cds.length === 0 ? (
        <div className="text-center py-24 text-black/50 dark:text-white/50">
          <p>No CDs yet.</p>
          <Link href="/add" className="underline underline-offset-4">
            Add your first one
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {cds.map((cd) => (
            <CdCard key={cd._id} cd={cd} />
          ))}
        </div>
      )}
    </main>
  );
}

function CdCard({ cd }: { cd: Cd }) {
  return (
    <div className="group relative flex flex-col gap-2">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-black/5 dark:bg-white/10 relative">
        {cd.coverArtUrl ? (
          <Image
            src={cd.coverArtUrl}
            alt={`${cd.title} cover art`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-black/30 dark:text-white/30 text-4xl">
            💿
          </div>
        )}
        <form
          action={deleteCd.bind(null, cd._id)}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            type="submit"
            title="Remove from collection"
            className="rounded-full bg-black/60 text-white w-7 h-7 flex items-center justify-center text-sm hover:bg-black/80"
          >
            ×
          </button>
        </form>
      </div>
      <div>
        <p className="font-medium text-sm leading-tight truncate">
          {cd.title}
        </p>
        <p className="text-sm text-black/60 dark:text-white/60 truncate">
          {cd.artist}
          {cd.year ? ` · ${cd.year}` : ""}
        </p>
      </div>
    </div>
  );
}
