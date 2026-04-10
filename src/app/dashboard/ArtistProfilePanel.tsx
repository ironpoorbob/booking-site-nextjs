import type { ReactNode } from "react";
import type { ArtistProfilePreview } from "./mock-data";
import { genreOptions } from "./options";

type ArtistProfilePanelProps = {
  artist: ArtistProfilePreview;
  headerAction?: ReactNode;
  title?: string;
};

export default function ArtistProfilePanel({
  artist,
  headerAction,
  title = "Artist Profile",
}: ArtistProfilePanelProps) {
  const genreLabels = artist.genres
    .map((genre) => genreOptions.find((option) => option.value === genre)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">{title}</p>
          <h1 className="mt-1 font-display text-5xl tracking-wider text-white">{artist.name}</h1>
          <p className="mt-2 text-zinc-300">{artist.city}</p>
        </div>
        {headerAction}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
          {artist.bandPicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.bandPicUrl}
              alt={`${artist.name} profile`}
              className="h-full max-h-[420px] w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/30 text-sm uppercase tracking-[0.12em] text-zinc-500">
              No band image yet
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400 uppercase">Summary</p>
            <p className="mt-1 text-zinc-200">{artist.summary}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400 uppercase">Genres</p>
            <p className="mt-1 text-zinc-200">{genreLabels || "Not set"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400 uppercase">Website</p>
            {artist.website ? (
              <a
                className="mt-2 inline-block break-all text-blue-300 underline decoration-white/30 underline-offset-2 hover:text-blue-200"
                href={artist.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {artist.website}
              </a>
            ) : (
              <p className="mt-1 text-zinc-200">No website listed.</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs text-zinc-400 uppercase">Spotify</p>
            {artist.spotify ? (
              <a
                className="mt-2 inline-block break-all text-green-300 underline decoration-white/30 underline-offset-2 hover:text-green-200"
                href={artist.spotify}
                target="_blank"
                rel="noopener noreferrer"
              >
                {artist.spotify}
              </a>
            ) : (
              <p className="mt-1 text-zinc-200">No Spotify link listed.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs text-zinc-400 uppercase">Description</p>
          <p className="mt-1 text-zinc-200">{artist.artistDescription}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
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
  );
}
