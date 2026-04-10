export type AccountType = "artist" | "club-booker";

export type DashboardProfile = {
  userId: string;
  accountType: AccountType;
  username: string;
  realName: string;
  email: string;
  location: string;
  bandName: string;
  venueName: string;
  artistType: string;
  artistGenres: string[];
  artistHomeCity: string;
  artistSetLength: string;
  artistDescription: string;
  youtubeLinks: string[];
  bandPicUrl: string;
  clubBookerType: string;
  venueCapacity: string;
  bookingContactEmail: string;
  clubPicUrl: string;
  typicalBookingNights: string;
  clubGenres: string[];
  artistNotes: string;
};

type SearchParamValue = string | string[] | undefined;

export type RawSearchParams = Record<string, SearchParamValue>;
export type ProfileFallback = Partial<Omit<DashboardProfile, "accountType">>;

export function toRawSearchParams(searchParams: URLSearchParams): RawSearchParams {
  const raw: RawSearchParams = {};

  searchParams.forEach((value, key) => {
    const existing = raw[key];

    if (existing === undefined) {
      raw[key] = value;
      return;
    }

    if (Array.isArray(existing)) {
      raw[key] = [...existing, value];
      return;
    }

    raw[key] = [existing, value];
  });

  return raw;
}

function firstValue(value: SearchParamValue): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function listValue(value: SearchParamValue): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [value];
}

function normalizeAccountType(value: string): AccountType {
  return value === "club-booker" ? "club-booker" : "artist";
}

export function getAccountTypeFromSearchParams(searchParams: RawSearchParams): AccountType {
  return normalizeAccountType(firstValue(searchParams.accountType));
}

export function parseProfileFromSearchParams(
  searchParams: RawSearchParams,
  fallback: ProfileFallback = {},
): DashboardProfile {
  const accountType = getAccountTypeFromSearchParams(searchParams);
  const artistGenresFromParams = listValue(searchParams.artistGenres);
  const youtubeLinksFromParams = listValue(searchParams.youtubeLinks);
  const clubGenresFromParams = listValue(searchParams.clubGenres);

  return {
    userId: firstValue(searchParams.userId) || fallback.userId || "not-set",
    accountType,
    username: firstValue(searchParams.username) || fallback.username || "newuser",
    realName: firstValue(searchParams.realName) || fallback.realName || "Not set",
    email: firstValue(searchParams.email) || fallback.email || "Not set",
    location: firstValue(searchParams.location) || fallback.location || "Not set",
    bandName: firstValue(searchParams.bandName) || fallback.bandName || "Not set",
    venueName: firstValue(searchParams.venueName) || fallback.venueName || "Not set",
    artistType: firstValue(searchParams.artistType) || fallback.artistType || "musician-band",
    artistGenres: artistGenresFromParams.length > 0 ? artistGenresFromParams : fallback.artistGenres || [],
    artistHomeCity: firstValue(searchParams.artistHomeCity) || fallback.artistHomeCity || "Not set",
    artistSetLength: firstValue(searchParams.artistSetLength) || fallback.artistSetLength || "Not set",
    artistDescription:
      firstValue(searchParams.artistDescription) || fallback.artistDescription || "Not set",
    youtubeLinks: youtubeLinksFromParams.length > 0 ? youtubeLinksFromParams : fallback.youtubeLinks || [],
    bandPicUrl: firstValue(searchParams.bandPicUrl) || fallback.bandPicUrl || "",
    clubBookerType: firstValue(searchParams.clubBookerType) || fallback.clubBookerType || "select-type",
    venueCapacity: firstValue(searchParams.venueCapacity) || fallback.venueCapacity || "Not set",
    bookingContactEmail:
      firstValue(searchParams.bookingContactEmail) || fallback.bookingContactEmail || "Not set",
    clubPicUrl: firstValue(searchParams.clubPicUrl) || fallback.clubPicUrl || "",
    typicalBookingNights:
      firstValue(searchParams.typicalBookingNights) || fallback.typicalBookingNights || "Not set",
    clubGenres: clubGenresFromParams.length > 0 ? clubGenresFromParams : fallback.clubGenres || [],
    artistNotes: firstValue(searchParams.artistNotes) || fallback.artistNotes || "Not set",
  };
}

export function toSearchString(profile: DashboardProfile): string {
  const params = new URLSearchParams();
  params.set("userId", profile.userId);
  params.set("accountType", profile.accountType);
  params.set("username", profile.username);
  params.set("realName", profile.realName);
  params.set("email", profile.email);
  params.set("location", profile.location);
  params.set("bandName", profile.bandName);
  params.set("venueName", profile.venueName);
  params.set("artistType", profile.artistType);
  profile.artistGenres.forEach((genre) => params.append("artistGenres", genre));
  params.set("artistHomeCity", profile.artistHomeCity);
  params.set("artistSetLength", profile.artistSetLength);
  params.set("artistDescription", profile.artistDescription);
  profile.youtubeLinks.forEach((link) => params.append("youtubeLinks", link));
  params.set("bandPicUrl", profile.bandPicUrl);
  params.set("clubBookerType", profile.clubBookerType);
  params.set("venueCapacity", profile.venueCapacity);
  params.set("bookingContactEmail", profile.bookingContactEmail);
  params.set("clubPicUrl", profile.clubPicUrl);
  params.set("typicalBookingNights", profile.typicalBookingNights);
  profile.clubGenres.forEach((genre) => params.append("clubGenres", genre));
  params.set("artistNotes", profile.artistNotes);
  return params.toString();
}
