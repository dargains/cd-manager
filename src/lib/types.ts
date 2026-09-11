export interface Cd {
  _id: string;
  artist: string;
  title: string;
  year: number | null;
  trackCount: number | null;
  coverArtUrl: string | null;
  musicbrainzId: string | null;
  genres: string[];
  createdAt: string;
}
