"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { getCoordinatesForLocation, getProfileFallbackFromMock, getSearchResultsFromMock } from "../mock-data";
import { artistTypeOptions, genreOptions } from "../options";
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

function normalizeText(value: string): string {
  return value.toLowerCase();
}

function matchesNeedGenre(lookingFor: string, selectedGenres: Set<string>): boolean {
  if (selectedGenres.size === 0) {
    return true;
  }

  const value = normalizeText(lookingFor);

  return Array.from(selectedGenres).some((genre) => {
    switch (genre) {
      case "alternative-indie":
        return value.includes("alternative") || value.includes("indie") || value.includes("alt");
      case "electronic-edm":
        return value.includes("electronic") || value.includes("edm");
      case "hip-hop-rap":
        return value.includes("hip-hop") || value.includes("hip hop") || value.includes("rap");
      case "rnb-soul":
        return value.includes("r&b") || value.includes("rnb") || value.includes("soul");
      default:
        return value.includes(genre.replace("-", " "));
    }
  });
}

function matchesNeedArtistType(lookingFor: string, artistType: string): boolean {
  if (!artistType || artistType === "musician-band") {
    return true;
  }

  const value = normalizeText(lookingFor);

  if (artistType === "dj") {
    return value.includes("dj");
  }
  if (artistType === "comedian") {
    return value.includes("comedian") || value.includes("comedy");
  }
  if (artistType === "magician") {
    return value.includes("magician") || value.includes("magic");
  }
  if (artistType === "trivia-host") {
    return value.includes("trivia");
  }

  return true;
}

function isNeedWithinDateRange(date: string, dateFrom: string, dateTo: string): boolean {
  if (dateFrom && date < dateFrom) {
    return false;
  }

  if (dateTo && date > dateTo) {
    return false;
  }

  return true;
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

function getDistanceMiles(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const earthRadiusMiles = 3958.8;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLatRadians = (from.lat * Math.PI) / 180;
  const toLatRadians = (to.lat * Math.PI) / 180;

  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLatRadians) *
      Math.cos(toLatRadians) *
      Math.sin(lngDelta / 2) *
      Math.sin(lngDelta / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusMiles * arc;
}

function SearchPageContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedClubNeed, setSelectedClubNeed] = useState<{
    clubUserId: string;
    clubName: string;
    city: string;
    summary: string;
    meta: string;
    date: string;
    lookingFor: string;
  } | null>(null);

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
  const distanceRadius = readFirst(raw.distanceRadius) || "25";
  const selectedGenres = new Set(readList(raw.genres));
  const artistSearchType = readFirst(raw.artistSearchType) || profile.artistType;
  const musicTypeFilters = new Set(readList(raw.musicTypes));
  const dateFrom = readFirst(raw.dateFrom);
  const dateTo = readFirst(raw.dateTo);
  const allResults = getSearchResultsFromMock(profile.accountType);
  const isArtistSearch = profile.accountType === "club-booker";
  const searchOrigin = !isArtistSearch
    ? getCoordinatesForLocation(query) ||
      getCoordinatesForLocation(profile.artistHomeCity) ||
      getCoordinatesForLocation(profile.location)
    : null;
  const distanceLimitMiles = distanceRadius === "any" ? null : Number(distanceRadius);

  const filteredResults = allResults
    .map((result) => {
      if (isArtistSearch) {
        return result;
      }

      const filteredNeeds = (result.availableDates ?? []).filter((need) => {
        if (!matchesNeedArtistType(need.lookingFor, artistSearchType)) {
          return false;
        }

        if (!matchesNeedGenre(need.lookingFor, musicTypeFilters)) {
          return false;
        }

        return isNeedWithinDateRange(need.date, dateFrom, dateTo);
      });

      return {
        ...result,
        availableDates: filteredNeeds,
      };
    })
    .filter((result) => {
    if (isArtistSearch && !hasSubmittedSearch) {
      return false;
    }

    if (!isArtistSearch && !hasSubmittedSearch) {
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
      if (
        distanceLimitMiles !== null &&
        searchOrigin &&
        typeof result.lat === "number" &&
        typeof result.lng === "number"
      ) {
        const distance = getDistanceMiles(searchOrigin, { lat: result.lat, lng: result.lng });

        if (distance > distanceLimitMiles) {
          return false;
        }
      }

      const hasActiveClubFilters =
        musicTypeFilters.size > 0 ||
        Boolean(dateFrom) ||
        Boolean(dateTo) ||
        artistSearchType !== "musician-band" ||
        distanceRadius !== "any";

      if (!hasActiveClubFilters) {
        return true;
      }

      return (result.availableDates?.length ?? 0) > 0;
    }

    return matchesSelectedGenre(result.genres, selectedGenres);
  })
    .sort((left, right) => {
      if (isArtistSearch || !searchOrigin) {
        return 0;
      }

      if (
        typeof left.lat !== "number" ||
        typeof left.lng !== "number" ||
        typeof right.lat !== "number" ||
        typeof right.lng !== "number"
      ) {
        return 0;
      }

      const leftDistance = getDistanceMiles(searchOrigin, { lat: left.lat, lng: left.lng });
      const rightDistance = getDistanceMiles(searchOrigin, { lat: right.lat, lng: right.lng });

      return leftDistance - rightDistance;
    });

  const pageTitle = profile.accountType === "artist" ? "Club-Centric Search" : "Artist-Centric Search";
  const pageSubtitle =
    profile.accountType === "artist"
      ? "Find venues and bookers that fit your sound."
      : `Find artists and bands for your upcoming dates at ${profile.venueName}.`;

  const dashboardHref = `/dashboard?${toSearchString(profile)}`;
  const returnTo = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const selectedClubRequestHref = useMemo(() => {
    if (!selectedClubNeed) {
      return "";
    }

    const params = new URLSearchParams();
    params.set("requestType", "club");
    params.set("artistName", profile.bandName !== "Not set" ? profile.bandName : profile.realName);
    params.set("clubName", selectedClubNeed.clubName);
    params.set("showDate", selectedClubNeed.date);
    params.set("setInfo", selectedClubNeed.lookingFor);
    params.set("returnTo", returnTo);
    return `/dashboard/book/thanks?${params.toString()}`;
  }, [profile.bandName, profile.realName, returnTo, selectedClubNeed]);

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
            <input type="hidden" name="clubPicUrl" value={profile.clubPicUrl} />
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

            {!isArtistSearch ? (
              <>
                <label className="form-group w-full sm:w-auto">
                  <span>Distance</span>
                  <select className="form-input" name="distanceRadius" defaultValue={distanceRadius}>
                    <option value="10">Within 10 miles</option>
                    <option value="25">Within 25 miles</option>
                    <option value="50">Within 50 miles</option>
                    <option value="any">Anywhere</option>
                  </select>
                </label>
                <label className="form-group w-full sm:w-auto">
                  <span>Artist Type</span>
                  <select className="form-input" name="artistSearchType" defaultValue={artistSearchType}>
                    {artistTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-group w-full sm:w-auto">
                  <span>Date From</span>
                  <input className="form-input" name="dateFrom" type="date" defaultValue={dateFrom} />
                </label>
                <label className="form-group w-full sm:w-auto">
                  <span>Date To</span>
                  <input className="form-input" name="dateTo" type="date" defaultValue={dateTo} />
                </label>
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

            {!isArtistSearch ? (
              <fieldset className="mt-3 w-full rounded-xl border border-white/15 bg-black/35 p-4">
                <legend className="px-1 text-sm font-semibold tracking-[0.08em] text-zinc-300 uppercase">
                  Music Type
                </legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {genreOptions.map((option) => (
                    <label key={option.value} className="inline-flex items-center gap-2 text-zinc-100">
                      <input
                        type="checkbox"
                        name="musicTypes"
                        value={option.value}
                        defaultChecked={musicTypeFilters.has(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
          </form>
        </section>

        {hasSubmittedSearch ? (
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
                                  className="rounded-md border border-white/15 bg-black/40"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedClubNeed({
                                        clubUserId: result.userId,
                                        clubName: result.name,
                                        city: result.city,
                                        summary: result.summary,
                                        meta: result.meta,
                                        date: need.date,
                                        lookingFor: need.lookingFor,
                                      })
                                    }
                                    className="w-full px-3 py-2 text-left transition-colors hover:bg-white/5"
                                  >
                                    <span className="font-semibold text-zinc-100">{formatted.label}</span>
                                    <span className="ml-1 text-xs text-zinc-400">({formatted.iso})</span>
                                    <span className="text-zinc-300">{" - "}</span>
                                    <span>{need.lookingFor}</span>
                                  </button>
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

      {selectedClubNeed ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-zinc-950 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.15em] text-zinc-400 uppercase">Club Booking Need</p>
                <h3 className="mt-1 font-display text-4xl tracking-wider text-white">
                  {selectedClubNeed.clubName}
                </h3>
                <p className="mt-1 text-zinc-300">{selectedClubNeed.city}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClubNeed(null)}
                className="rounded-md px-2 py-1 font-display text-3xl leading-none font-bold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close club booking need"
              >
                X
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Requested Date</p>
              <p className="mt-1 font-semibold text-zinc-100">
                {formatNeedDate(selectedClubNeed.date).label}
              </p>
              <p className="mt-1 text-sm text-zinc-400">{selectedClubNeed.date}</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs tracking-[0.12em] text-zinc-400 uppercase">Looking For</p>
              <p className="mt-1 text-zinc-200">{selectedClubNeed.lookingFor}</p>
            </div>

            <p className="mt-4 text-zinc-200">{selectedClubNeed.summary}</p>
            <p className="mt-3 text-sm text-zinc-400">{selectedClubNeed.meta}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link className="btn-secondary" href={`/dashboard/club/${selectedClubNeed.clubUserId}`}>
                View Profile
              </Link>
              <Link className="btn-primary ml-auto" href={selectedClubRequestHref}>
                Send Booking Request
              </Link>
            </div>
          </div>
        </div>
      ) : null}
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
