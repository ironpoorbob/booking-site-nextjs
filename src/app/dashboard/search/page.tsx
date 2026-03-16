"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { getProfileFallbackFromMock, getSearchResultsFromMock } from "../mock-data";
import { genreOptions } from "../options";
import {
  getAccountTypeFromSearchParams,
  parseProfileFromSearchParams,
  toRawSearchParams,
  toSearchString,
} from "../profile";
import ArtistSearchResults from "./ArtistSearchResults";
import ShowTimeFields from "./ShowTimeFields";

function readFirst(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function readList(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function matchesSelectedGenre(genres: string[] | undefined, selectedGenres: Set<string>): boolean {
  if (selectedGenres.size === 0) {
    return true;
  }

  const normalizedGenres = genres ?? [];

  return normalizedGenres.some((genre) => selectedGenres.has(genre));
}

function formatNeedDate(dateString: string): { label: string; iso: string } {
  const parsed = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return { label: dateString, iso: dateString };
  }

  const label = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(parsed);

  return { label, iso: dateString };
}

function SearchPageContent() {
  const searchParams = useSearchParams();

  const raw = useMemo(
    () => toRawSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const profile = useMemo(() => {
    const accountType = getAccountTypeFromSearchParams(raw);
    const fallback = getProfileFallbackFromMock(accountType);
    return parseProfileFromSearchParams(raw, fallback);
  }, [raw]);

  const query = readFirst(raw.q).toLowerCase().trim();
  const showDate = readFirst(raw.showDate);
  const showTime = readFirst(raw.showTime);
  const use24HourClock = readFirst(raw.showClock24) === "1";
  const hasSubmittedSearch = readFirst(raw.submitted) === "1";
  const selectedGenres = new Set(readList(raw.genres));
  const allResults = getSearchResultsFromMock(profile.accountType);
  const isArtistSearch = profile.accountType === "club-booker";

  const filteredResults = allResults.filter((result) => {
    if (isArtistSearch && !hasSubmittedSearch) {
      return false;
    }

    const queryMatch =
      !query ||
      result.name.toLowerCase().includes(query) ||
      result.city.toLowerCase().includes(query) ||
      result.summary.toLowerCase().includes(query);

    if (!queryMatch) {
      return false;
    }

    if (!isArtistSearch) {
      return true;
    }

    return matchesSelectedGenre(result.genres, selectedGenres);
  });

  const pageTitle = profile.accountType === "artist" ? "Club-Centric Search" : "Artist-Centric Search";
  const pageSubtitle =
    profile.accountType === "artist"
      ? "Find venues and bookers that fit your sound."
      : `Find artists and bands for your upcoming dates at ${profile.venueName}.`;

  const dashboardHref = `/dashboard?${toSearchString(profile)}`;

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl tracking-wider text-white md:text-5xl">{pageTitle}</h1>
              {profile.accountType === "club-booker" ? (
                <p className="mt-2 text-zinc-300">
                  Find artists and bands for your upcoming dates at{" "}
                  <strong className="font-semibold text-zinc-100">{profile.venueName}</strong>.
                </p>
              ) : (
                <p className="mt-2 text-zinc-300">{pageSubtitle}</p>
              )}
            </div>
            <Link className="btn-secondary" href={dashboardHref}>
              Back to Dashboard
            </Link>
          </div>

          <form className="mt-6 flex flex-wrap gap-3" action={withBasePath("/dashboard/search")} method="get">
            <input type="hidden" name="submitted" value="1" />
            <input type="hidden" name="accountType" value={profile.accountType} />
            <input type="hidden" name="userId" value={profile.userId} />
            <input type="hidden" name="username" value={profile.username} />
            <input type="hidden" name="realName" value={profile.realName} />
            <input type="hidden" name="email" value={profile.email} />
            <input type="hidden" name="location" value={profile.location} />
            <input type="hidden" name="bandName" value={profile.bandName} />
            <input type="hidden" name="venueName" value={profile.venueName} />
            <input type="hidden" name="artistType" value={profile.artistType} />
            <input type="hidden" name="artistHomeCity" value={profile.artistHomeCity} />
            <input type="hidden" name="artistSetLength" value={profile.artistSetLength} />
            <input type="hidden" name="artistDescription" value={profile.artistDescription} />
            <input type="hidden" name="bandPicUrl" value={profile.bandPicUrl} />
            <input type="hidden" name="clubBookerType" value={profile.clubBookerType} />
            <input type="hidden" name="venueCapacity" value={profile.venueCapacity} />
            <input type="hidden" name="bookingContactEmail" value={profile.bookingContactEmail} />
            <input type="hidden" name="typicalBookingNights" value={profile.typicalBookingNights} />
            <input type="hidden" name="artistNotes" value={profile.artistNotes} />
            {profile.artistGenres.map((genre) => (
              <input key={genre} type="hidden" name="artistGenres" value={genre} />
            ))}
            {profile.clubGenres.map((genre) => (
              <input key={genre} type="hidden" name="clubGenres" value={genre} />
            ))}
            {profile.youtubeLinks.map((link) => (
              <input key={link} type="hidden" name="youtubeLinks" value={link} />
            ))}

            <input
              className="form-input max-w-xl"
              name="q"
              type="text"
              defaultValue={readFirst(raw.q)}
              placeholder={
                profile.accountType === "artist"
                  ? "Search clubs by name or city"
                  : "Search artists by name or city"
              }
            />
            <button className="btn-primary" type="submit">
              Search
            </button>

            {isArtistSearch ? (
              <>
                <label className="form-group w-full sm:w-auto">
                  <span>Show Date</span>
                  <input className="form-input" name="showDate" type="date" defaultValue={showDate} />
                </label>
                <ShowTimeFields
                  initialShowTime={showTime}
                  initialUse24HourClock={use24HourClock}
                />
              </>
            ) : null}

            {isArtistSearch ? (
              <fieldset className="mt-3 w-full rounded-xl border border-white/15 bg-black/35 p-4">
                <legend className="px-1 text-sm font-semibold tracking-[0.08em] text-zinc-300 uppercase">
                  Preferred Genres
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {genreOptions.map((option) => (
                    <label key={option.value} className="inline-flex items-center gap-2 text-zinc-100">
                      <input
                        type="checkbox"
                        name="genres"
                        value={option.value}
                        defaultChecked={selectedGenres.has(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </form>
        </section>

        {!isArtistSearch || hasSubmittedSearch ? (
          <section className="rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
            <h2 className="font-display text-3xl tracking-wider text-white">Results</h2>
            {isArtistSearch ? (
              <ArtistSearchResults results={filteredResults} profileQuery={toSearchString(profile)} />
            ) : (
              <div className="mt-4 grid gap-3">
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => (
                    <article key={`${result.name}-${result.city}`} className="rounded-xl border border-white/10 bg-black/40 p-4">
                      <p className="font-semibold text-white">{result.name}</p>
                      <p className="mt-1 text-zinc-300">{result.city}</p>
                      <p className="mt-2 text-zinc-200">{result.summary}</p>
                      <p className="mt-2 text-sm text-zinc-400">{result.meta}</p>
                      {result.availableDates && result.availableDates.length > 0 ? (
                        <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
                          <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Booking Needs</p>
                          <ul className="mt-2 space-y-2 text-sm text-zinc-200">
                            {result.availableDates.map((need) => {
                              const formatted = formatNeedDate(need.date);

                              return (
                                <li
                                  key={`${need.date}-${need.lookingFor}`}
                                  className="rounded-md border border-white/15 bg-black/40 px-3 py-2"
                                >
                                  <span className="font-semibold text-zinc-100">{formatted.label}</span>
                                  <span className="ml-1 text-xs text-zinc-400">({formatted.iso})</span>
                                  <span className="text-zinc-300">{" - "}</span>
                                  <span>{need.lookingFor}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <p className="text-zinc-300">No matches found for this query.</p>
                )}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="min-h-screen py-10" />}>
      <SearchPageContent />
    </Suspense>
  );
}
