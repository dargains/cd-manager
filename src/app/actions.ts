"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import { fetchAlbumMetadata } from "@/lib/musicbrainz";

export interface AddCdState {
  error?: string;
}

export async function addCd(
  _prevState: AddCdState,
  formData: FormData
): Promise<AddCdState> {
  const artist = (formData.get("artist") as string | null)?.trim();
  const title = (formData.get("title") as string | null)?.trim();

  if (!artist || !title) {
    return { error: "Please enter both a band/artist and an album title." };
  }

  let metadata;
  try {
    metadata = await fetchAlbumMetadata(artist, title);
  } catch (err) {
    console.error("MusicBrainz metadata lookup failed:", err);
    return {
      error: "Couldn't reach MusicBrainz to fetch metadata. Please try again.",
    };
  }

  const db = await getDb();
  await db.collection("cds").insertOne({
    artist: metadata?.artist ?? artist,
    title: metadata?.title ?? title,
    year: metadata?.year ?? null,
    trackCount: metadata?.trackCount ?? null,
    coverArtUrl: metadata?.coverArtUrl ?? null,
    musicbrainzId: metadata?.musicbrainzId ?? null,
    genres: metadata?.genres ?? [],
    createdAt: new Date(),
  });

  revalidatePath("/");
  redirect("/");
}

export async function deleteCd(id: string) {
  const db = await getDb();
  await db.collection("cds").deleteOne({ _id: new ObjectId(id) });
  revalidatePath("/");
}
