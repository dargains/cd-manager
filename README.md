# CD Manager

An app to manage my CD collection.

- **Home page** — a grid of every CD in the collection (thumbnail, band, title, year).
- **Add page** (`/add`) — enter just the band and album title; the app looks up the
  rest (release year, track count, cover art) via the [MusicBrainz](https://musicbrainz.org/)
  and [Cover Art Archive](https://coverartarchive.org/) APIs and saves it to MongoDB.

## Stack

Next.js (App Router) + TypeScript + Tailwind, MongoDB for storage, deployed on Vercel.

## Local development

1. Copy `.env.example` to `.env.local` and fill in `MONGODB_URI` with a connection
   string (e.g. from a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).
2. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push this repo to GitHub and import it into [Vercel](https://vercel.com/new).
2. In the Vercel project settings, add an environment variable `MONGODB_URI`
   (and optionally `MONGODB_DB`, `MUSICBRAINZ_CONTACT`) with your MongoDB connection string.
3. Deploy. No other configuration is needed.
