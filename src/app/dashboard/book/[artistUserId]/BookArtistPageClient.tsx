"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { getArtistByUserIdFromMock, getProfileFallbackFromMock } from "../../mock-data";
import {
  getAccountTypeFromSearchParams,
  parseProfileFromSearchParams,
  toRawSearchParams,
  toSearchString,
} from "../../profile";

type BookArtistPageClientProps = {
  artistUserId: string;
};

export default function BookArtistPageClient({ artistUserId }: BookArtistPageClientProps) {
  const searchParams = useSearchParams();

  const profile = useMemo(() => {
    const raw = toRawSearchParams(new URLSearchParams(searchParams.toString()));
    const accountType = getAccountTypeFromSearchParams(raw);
    const fallback = getProfileFallbackFromMock(accountType);
    return parseProfileFromSearchParams(raw, fallback);
  }, [searchParams]);

  const artist = getArtistByUserIdFromMock(artistUserId);
  const returnToRaw = searchParams.get("returnTo");
  const showDatePrefill = searchParams.get("showDate") ?? "";
  const showTimePrefill = searchParams.get("showTime") ?? "";
  const fallbackSearchHref = `/dashboard/search?${toSearchString(profile)}`;
  const cancelHref =
    returnToRaw && returnToRaw.startsWith("/") ? returnToRaw : fallbackSearchHref;

  if (!artist) {
    return (
      <main className="min-h-screen py-10">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <h1 className="font-display text-4xl tracking-wider text-white">Artist Not Found</h1>
          <p className="mt-3 text-zinc-300">The selected artist could not be loaded.</p>
          <Link className="btn-secondary mt-5" href={cancelHref}>
            Back to Search
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
        <h1 className="font-display text-4xl tracking-wider text-white md:text-5xl">Booking Request</h1>
        <p className="mt-2 text-zinc-300">Review the details and submit a formal booking request.</p>

        <div className="mt-6 grid gap-4 rounded-xl border border-white/15 bg-black/30 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Artist</p>
            <p className="mt-1 font-semibold text-white">{artist.name}</p>
          </div>
          <div>
            <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Artist City</p>
            <p className="mt-1 font-semibold text-white">{artist.city}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Artist Summary</p>
            <p className="mt-1 text-zinc-200">{artist.summary}</p>
          </div>
        </div>

        <form className="mt-6 space-y-4" action={withBasePath("/dashboard/book/thanks")} method="get">
          <input type="hidden" name="returnTo" value={cancelHref} />
          <input type="hidden" name="artistName" value={artist.name} />
          <label className="form-group">
            <span>Club / Venue</span>
            <input className="form-input" type="text" name="clubName" defaultValue={profile.venueName} />
          </label>

          <label className="form-group">
            <span>Club City</span>
            <input className="form-input" type="text" name="clubCity" defaultValue={profile.location} />
          </label>

          <label className="form-group">
            <span>Booking Contact Email</span>
            <input
              className="form-input"
              type="email"
              name="contactEmail"
              defaultValue={profile.bookingContactEmail !== "Not set" ? profile.bookingContactEmail : profile.email}
            />
          </label>

          <label className="form-group">
            <span>Requested Show Date</span>
            <input className="form-input" type="date" name="showDate" defaultValue={showDatePrefill} />
          </label>

          <label className="form-group">
            <span>Requested Show Time</span>
            <input className="form-input" type="time" name="showTime" defaultValue={showTimePrefill} />
          </label>

          <label className="form-group">
            <span>Set Time / Duration</span>
            <input className="form-input" type="text" name="setInfo" placeholder="8:00 PM, 45 minutes" />
          </label>

          <label className="form-group">
            <span>Show Details</span>
            <textarea
              className="form-input min-h-28"
              name="showDetails"
              placeholder="Compensation, lineup, backline expectations, and special notes."
            />
          </label>

          <p className="text-sm text-zinc-300">
            By clicking &quot;Book Now&quot; you are commiting to have this act play at your club on the above
            info. An email will come with the band contact information.
          </p>

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="submit">
              Book Now
            </button>
            <Link className="btn-secondary" href={cancelHref}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
