"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { addCd, type AddCdState } from "../actions";

const initialState: AddCdState = {};

export default function AddCdPage() {
  const [state, formAction] = useActionState(addCd, initialState);

  return (
    <main className="flex-1 max-w-lg w-full mx-auto px-6 py-10">
      <Link
        href="/"
        className="text-sm text-black/60 dark:text-white/60 hover:underline underline-offset-4"
      >
        ← Back to collection
      </Link>

      <h1 className="text-2xl font-semibold mt-4 mb-1">Add a CD</h1>
      <p className="text-sm text-black/60 dark:text-white/60 mb-8">
        Enter the band and album title — we&apos;ll look up the release year,
        track count and cover art for you.
      </p>

      <form action={formAction} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="artist" className="text-sm font-medium">
            Band / Artist
          </label>
          <input
            id="artist"
            name="artist"
            type="text"
            required
            placeholder="e.g. Radiohead"
            className="rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className="text-sm font-medium">
            Album Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g. OK Computer"
            className="rounded-md border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton />
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
      className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {pending ? "Looking up metadata…" : "Add to collection"}
    </button>
  );
}
