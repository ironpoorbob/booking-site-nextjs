"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { withBasePath } from "@/lib/base-path";
import { getProfileFallbackFromMock } from "../mock-data";
import { artistTypeOptions, clubBookerTypeOptions, genreOptions } from "../options";
import {
  getAccountTypeFromSearchParams,
  parseProfileFromSearchParams,
  toRawSearchParams,
  toSearchString,
} from "../profile";

function EditProfilePageContent() {
  const searchParams = useSearchParams();

  const profile = useMemo(() => {
    const raw = toRawSearchParams(new URLSearchParams(searchParams.toString()));
    const accountType = getAccountTypeFromSearchParams(raw);
    const fallback = getProfileFallbackFromMock(accountType);
    return parseProfileFromSearchParams(raw, fallback);
  }, [searchParams]);

  const [selectedAccountType, setSelectedAccountType] = useState<"artist" | "club-booker" | null>(
    null,
  );
  const activeAccountType = selectedAccountType ?? profile.accountType;

  const cancelHref = `/dashboard?${toSearchString(profile)}`;

  return (
    <main className="min-h-screen py-10">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-white/15 bg-black/70 p-6 md:p-8">
        <h1 className="font-display text-4xl tracking-wider text-white md:text-5xl">Edit Profile</h1>
        <p className="mt-2 text-zinc-300">Update your account information for your dashboard.</p>

        <form className="mt-8 space-y-5" action={withBasePath("/dashboard")} method="get">
          <input type="hidden" name="userId" value={profile.userId} />

          <div>
            <p className="mb-2 text-sm tracking-[0.12em] text-zinc-200 uppercase">Account Type</p>
            <div className="role-group">
              <label className="role-option">
                <input
                  type="radio"
                  name="accountType"
                  value="artist"
                  checked={activeAccountType === "artist"}
                  onChange={() => setSelectedAccountType("artist")}
                />
                Artist
              </label>
              <label className="role-option">
                <input
                  type="radio"
                  name="accountType"
                  value="club-booker"
                  checked={activeAccountType === "club-booker"}
                  onChange={() => setSelectedAccountType("club-booker")}
                />
                Club / Booker
              </label>
            </div>
          </div>

          <label className="form-group">
            <span>Username</span>
            <input className="form-input" name="username" type="text" defaultValue={profile.username} />
          </label>

          <label className="form-group">
            <span>Real Name</span>
            <input className="form-input" name="realName" type="text" defaultValue={profile.realName} />
          </label>

          <label className="form-group">
            <span>Email</span>
            <input className="form-input" name="email" type="email" defaultValue={profile.email} />
          </label>

          {activeAccountType === "artist" ? (
            <label className="form-group">
              <span>Location</span>
              <input className="form-input" name="location" type="text" defaultValue={profile.location} />
            </label>
          ) : null}

          {activeAccountType === "artist" ? (
            <>
              <h2 className="font-display text-2xl tracking-wider text-white">Artist/Band Details</h2>

              <label className="form-group">
                <span>Artist or Band Name</span>
                <input className="form-input" name="bandName" type="text" defaultValue={profile.bandName} />
              </label>

              <label className="form-group">
                <span>Artist Type</span>
                <select className="form-input" name="artistType" defaultValue={profile.artistType}>
                  {artistTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-xl border border-white/15 bg-black/30 p-4">
                <p className="px-1 text-sm font-semibold tracking-[0.08em] text-zinc-300 uppercase">
                  Preferred Genres
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {genreOptions.map((option) => (
                    <label key={option.value} className="inline-flex items-center gap-2 text-zinc-100">
                      <input
                        type="checkbox"
                        name="artistGenres"
                        value={option.value}
                        defaultChecked={profile.artistGenres.includes(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="form-group">
                <span>Home City</span>
                <input
                  className="form-input"
                  name="artistHomeCity"
                  type="text"
                  defaultValue={profile.artistHomeCity}
                />
              </label>

              <label className="form-group">
                <span>Typical Set Length</span>
                <input
                  className="form-input"
                  name="artistSetLength"
                  type="text"
                  placeholder="45 minutes"
                  defaultValue={profile.artistSetLength}
                />
              </label>

              <label className="form-group">
                <span>Artist Description</span>
                <textarea
                  className="form-input min-h-28"
                  name="artistDescription"
                  defaultValue={profile.artistDescription}
                  placeholder="Describe your act, performance style, and venue fit."
                />
              </label>

              <label className="form-group">
                <span>Upload Audio</span>
                <input className="form-input" name="artistMediaFiles" type="file" accept="audio/*" multiple />
                <span className="mt-2 block text-sm text-zinc-400">
                  Upload demos or live audio clips. Use YouTube links for video.
                </span>
              </label>

              <label className="form-group">
                <span>Band Picture</span>
                <input className="form-input" name="bandPicFile" type="file" accept="image/*" />
                <span className="mt-2 block text-sm text-zinc-400">
                  Prototype upload field. Persisted file storage will be wired later.
                </span>
              </label>

              <label className="form-group">
                <span>Band Picture URL</span>
                <input
                  className="form-input"
                  name="bandPicUrl"
                  type="url"
                  defaultValue={profile.bandPicUrl}
                  placeholder="https://..."
                />
              </label>

              <div className="rounded-xl border border-white/15 bg-black/30 p-4">
                <p className="px-1 text-sm font-semibold tracking-[0.08em] text-zinc-300 uppercase">
                  YouTube Links
                </p>
                <div className="mt-2 space-y-3">
                  <label className="form-group">
                    <span>YouTube Link 1</span>
                    <input
                      className="form-input"
                      name="youtubeLinks"
                      type="url"
                      defaultValue={profile.youtubeLinks[0] ?? ""}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </label>
                  <label className="form-group">
                    <span>YouTube Link 2</span>
                    <input
                      className="form-input"
                      name="youtubeLinks"
                      type="url"
                      defaultValue={profile.youtubeLinks[1] ?? ""}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </label>
                  <label className="form-group">
                    <span>YouTube Link 3</span>
                    <input
                      className="form-input"
                      name="youtubeLinks"
                      type="url"
                      defaultValue={profile.youtubeLinks[2] ?? ""}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl tracking-wider text-white">Club/Booker Details</h2>

              <label className="form-group">
                <span>Venue or Booker Name</span>
                <input className="form-input" name="venueName" type="text" defaultValue={profile.venueName} />
              </label>

              <label className="form-group">
                <span>Club/Booker Type</span>
                <select className="form-input" name="clubBookerType" defaultValue={profile.clubBookerType}>
                  {clubBookerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-group">
                <span>Venue Capacity</span>
                <input className="form-input" name="venueCapacity" type="text" defaultValue={profile.venueCapacity} />
              </label>

              <label className="form-group">
                <span>City</span>
                <input className="form-input" name="location" type="text" defaultValue={profile.location} />
              </label>

              <label className="form-group">
                <span>Booking Contact Email</span>
                <input
                  className="form-input"
                  name="bookingContactEmail"
                  type="email"
                  defaultValue={profile.bookingContactEmail}
                />
              </label>

              <label className="form-group">
                <span>Venue Image URL</span>
                <input
                  className="form-input"
                  name="clubPicUrl"
                  type="url"
                  defaultValue={profile.clubPicUrl}
                  placeholder="https://www.bottomofthehill.com/images/Bred1.jpg"
                />
              </label>

              <label className="form-group">
                <span>Typical Booking Nights</span>
                <input
                  className="form-input"
                  name="typicalBookingNights"
                  type="text"
                  defaultValue={profile.typicalBookingNights}
                />
              </label>

              <div className="rounded-xl border border-white/15 bg-black/30 p-4">
                <p className="px-1 text-sm font-semibold tracking-[0.08em] text-zinc-300 uppercase">
                  Preferred Genres
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {genreOptions.map((option) => (
                    <label key={option.value} className="inline-flex items-center gap-2 text-zinc-100">
                      <input
                        type="checkbox"
                        name="clubGenres"
                        value={option.value}
                        defaultChecked={profile.clubGenres.includes(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <label className="form-group">
                <span>Notes for Artists</span>
                <textarea
                  className="form-input min-h-28"
                  name="artistNotes"
                  defaultValue={profile.artistNotes}
                  placeholder="Share expectations, set length preferences, and production details."
                />
              </label>
            </>
          )}

          {activeAccountType === "artist" ? (
            <>
              <input type="hidden" name="venueName" value={profile.venueName} />
              <input type="hidden" name="clubBookerType" value={profile.clubBookerType} />
              <input type="hidden" name="venueCapacity" value={profile.venueCapacity} />
              <input type="hidden" name="bookingContactEmail" value={profile.bookingContactEmail} />
              <input type="hidden" name="clubPicUrl" value={profile.clubPicUrl} />
              <input type="hidden" name="typicalBookingNights" value={profile.typicalBookingNights} />
              {profile.clubGenres.map((genre) => (
                <input key={genre} type="hidden" name="clubGenres" value={genre} />
              ))}
              <input type="hidden" name="artistNotes" value={profile.artistNotes} />
            </>
          ) : (
            <>
              <input type="hidden" name="bandName" value={profile.bandName} />
              <input type="hidden" name="artistType" value={profile.artistType} />
              <input type="hidden" name="artistHomeCity" value={profile.artistHomeCity} />
              <input type="hidden" name="artistSetLength" value={profile.artistSetLength} />
              <input type="hidden" name="artistDescription" value={profile.artistDescription} />
              <input type="hidden" name="bandPicUrl" value={profile.bandPicUrl} />
              <input type="hidden" name="clubPicUrl" value={profile.clubPicUrl} />
              {profile.artistGenres.map((genre) => (
                <input key={genre} type="hidden" name="artistGenres" value={genre} />
              ))}
              {profile.youtubeLinks.map((link) => (
                <input key={link} type="hidden" name="youtubeLinks" value={link} />
              ))}
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" type="submit">
              Save Profile
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

export default function EditProfilePage() {
  return (
    <Suspense fallback={<main className="min-h-screen py-10" />}>
      <EditProfilePageContent />
    </Suspense>
  );
}
