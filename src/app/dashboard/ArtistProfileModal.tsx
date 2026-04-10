"use client";

import { useMemo } from "react";
import ArtistProfilePanel from "./ArtistProfilePanel";
import { getArtistByUserIdFromMock } from "./mock-data";

type ArtistProfileModalProps = {
  artistUserId: string;
  onClose: () => void;
};

export default function ArtistProfileModal({ artistUserId, onClose }: ArtistProfileModalProps) {
  const artist = useMemo(() => getArtistByUserIdFromMock(artistUserId), [artistUserId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
        {artist ? (
          <ArtistProfilePanel
            artist={artist}
            headerAction={
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close artist profile"
              >
                X
              </button>
            }
          />
        ) : (
          <div className="rounded-2xl border border-white/20 bg-zinc-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Artist Profile</p>
                <h2 className="mt-1 font-display text-4xl tracking-wider text-white">Artist Not Found</h2>
                <p className="mt-3 text-zinc-300">No artist profile matches this ID.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close artist profile"
              >
                X
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
