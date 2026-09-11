"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { addCd, type AddCdState } from "../actions";

const initialState: AddCdState = {};

export default function AddCdPage() {
  const [state, formAction] = useActionState(addCd, initialState);
  // Controlled inputs: React resets uncontrolled fields after any form
  // action that resolves without navigating away (e.g. a validation error),
  // which would otherwise wipe what was typed. Keeping the value in state
  // here means it survives that reset.
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");

  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-6 py-10">
      <Link
        href="/"
        className="text-sm text-black/60 dark:text-white/60 hover:underline hover:text-foreground underline-offset-4 transition-colors"
      >
        ← Back to collection
      </Link>

      <div className="animate-in">
        <h1 className="text-2xl font-semibold mt-4 mb-1">Add a CD</h1>
        <p className="text-sm text-black/60 dark:text-white/60 mb-8">
          Enter the band and album title — we&apos;ll look up the release
          year, track count and cover art for you.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        <div
          className="flex flex-col gap-1.5 animate-in"
          style={{ "--delay": "60ms" } as React.CSSProperties}
        >
          <label htmlFor="artist" className="text-sm font-medium">
            Band / Artist
          </label>
          <input
            id="artist"
            name="artist"
            type="text"
            required
            autoFocus
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. Radiohead"
            className="rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-foreground"
          />
        </div>

        <div
          className="flex flex-col gap-1.5 animate-in"
          style={{ "--delay": "110ms" } as React.CSSProperties}
        >
          <label htmlFor="title" className="text-sm font-medium">
            Album Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. OK Computer"
            className="rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-foreground"
          />
        </div>

        {state?.error && (
          <p
            className="text-sm text-red-600 dark:text-red-400 animate-in"
            role="alert"
          >
            {state.error}
          </p>
        )}

        <div
          className="animate-in"
          style={{ "--delay": "160ms" } as React.CSSProperties}
        >
          <SubmitButton />
        </div>
      </form>
    </main>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium transition-all hover:opacity-90 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
    >
      {pending && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-background/40 border-t-background animate-spin" />
      )}
      {pending ? "Looking up metadata…" : "Add to collection"}
    </button>
  );
}
