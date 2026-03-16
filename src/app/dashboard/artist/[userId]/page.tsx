import Link from "next/link";
import { getArtistByUserIdFromMock, getArtistUserIdsFromMock } from "../../mock-data";
import { genreOptions } from "../../options";

type ArtistProfilePageProps = {
  params: Promise<{ userId: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const userIds = getArtistUserIdsFromMock();
  return userIds.map((userId) => ({ userId }));
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { userId } = await params;
  const artist = getArtistByUserIdFromMock(userId);

  if (!artist) {
    return (
      <main className="min-h-screen py-10">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <h1 className="font-display text-4xl tracking-wider text-white">Artist Not Found</h1>
          <p className="mt-3 text-zinc-300">No artist profile matches this ID.</p>
          <Link className="btn-secondary mt-5" href="/dashboard/search?accountType=club-booker">
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  const genreLabels = artist.genres
    .map((genre) => genreOptions.find((option) => option.value === genre)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Artist Profile</p>
              <h1 className="mt-1 font-display text-5xl tracking-wider text-white">{artist.name}</h1>
              <p className="mt-2 text-zinc-300">{artist.city}</p>
            </div>
            <Link className="btn-secondary" href="/dashboard/search?accountType=club-booker">
              Back to Search
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">Summary</p>
              <p className="mt-1 text-zinc-200">{artist.summary}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs text-zinc-400 uppercase">Genres</p>
              <p className="mt-1 text-zinc-200">{genreLabels || "Not set"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
              <p className="text-xs text-zinc-400 uppercase">Description</p>
              <p className="mt-1 text-zinc-200">{artist.artistDescription}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 sm:col-span-2">
              <p className="text-xs text-zinc-400 uppercase">YouTube Links</p>
              {artist.youtube.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {artist.youtube.map((link) => (
                    <li key={link}>
                      <a
                        className="text-blue-300 underline decoration-white/30 underline-offset-2 hover:text-blue-200"
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-zinc-200">No YouTube links listed.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
