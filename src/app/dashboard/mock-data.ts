import rawMockData from "../../../public/mock/search-data.json";
import type { AccountType, ProfileFallback } from "./profile";

type MockArtist = {
  user_id?: string;
  accountType?: string;
  name: string;
  email?: string;
  city: string;
  genre?: string | string[];
  summary?: string;
  bandPicUrl?: string;
  artistDescription?: string;
  youtube?: string[];
};

type MockClub = {
  user_id?: string;
  accountType?: string;
  name: string;
  email?: string;
  city: string;
  capacity?: number;
  summary?: string;
  availableDates?: Array<{
    date: string;
    lookingFor: string;
  }>;
};

type MockData = {
  artists?: MockArtist[];
  clubs?: MockClub[];
};

let cachedMockData: MockData | null = null;

function normalizeMockGenre(genre: string): string {
  const value = genre.toLowerCase();

  if (value.includes("alternative") || value.includes("indie") || value.includes("alt")) {
    return "alternative-indie";
  }
  if (value.includes("hip-hop") || value.includes("hip hop") || value.includes("rap")) {
    return "hip-hop-rap";
  }
  if (value.includes("r&b") || value.includes("rnb") || value.includes("soul")) {
    return "rnb-soul";
  }
  if (value.includes("electronic") || value.includes("edm")) {
    return "electronic-edm";
  }
  if (value.includes("rock")) {
    return "rock";
  }
  if (value.includes("metal")) {
    return "metal";
  }
  if (value.includes("punk")) {
    return "punk";
  }
  if (value.includes("pop")) {
    return "pop";
  }
  if (value.includes("country")) {
    return "country";
  }
  if (value.includes("jazz")) {
    return "jazz";
  }
  if (value.includes("blues")) {
    return "blues";
  }
  if (value.includes("latin")) {
    return "latin";
  }

  return "";
}

function normalizeMockGenres(genre: string | string[] | undefined): string[] {
  if (!genre) {
    return [];
  }

  const values = Array.isArray(genre) ? genre : [genre];

  return values.map((value) => normalizeMockGenre(value)).filter(Boolean);
}

export type SearchResult = {
  userId: string;
  name: string;
  city: string;
  summary: string;
  meta: string;
  email?: string;
  genres?: string[];
  artistDescription?: string;
  bandPicUrl?: string;
  youtube?: string[];
  availableDates?: Array<{
    date: string;
    lookingFor: string;
  }>;
};

export type ArtistProfilePreview = {
  userId: string;
  name: string;
  city: string;
  summary: string;
  artistDescription: string;
  genres: string[];
  bandPicUrl: string;
  youtube: string[];
};

export type ClubProfilePreview = {
  userId: string;
  name: string;
  city: string;
  summary: string;
  capacity: string;
  availableDates: Array<{
    date: string;
    lookingFor: string;
  }>;
};

function loadMockData(): MockData {
  if (cachedMockData) {
    return cachedMockData;
  }

  cachedMockData = rawMockData as MockData;
  return cachedMockData;
}

export function getProfileFallbackFromMock(accountType: AccountType): ProfileFallback {
  try {
    const data = loadMockData();

    if (accountType === "artist") {
      const firstArtist = data.artists?.[0];

      if (!firstArtist) {
        return {};
      }

      return {
        userId: firstArtist.user_id ?? "artist_mock_001",
        realName: firstArtist.name,
        email: firstArtist.email ?? "artist@gmail.com",
        location: firstArtist.city,
        bandName: firstArtist.name,
        artistType: "musician-band",
        artistGenres: normalizeMockGenres(firstArtist.genre),
        artistHomeCity: firstArtist.city,
        artistSetLength: "45 minutes",
        artistDescription: firstArtist.summary ?? "Describe your act and venue fit.",
        youtubeLinks: [],
        bandPicUrl: firstArtist.bandPicUrl ?? "",
      };
    }

    const firstClub = data.clubs?.[0];

    if (!firstClub) {
      return {};
    }

    return {
      userId: firstClub.user_id ?? "club_mock_001",
      realName: firstClub.name,
      email: firstClub.email ?? "club@gmail.com",
      location: firstClub.city,
      venueName: firstClub.name,
      clubBookerType: "venue-club",
      venueCapacity: firstClub.capacity ? String(firstClub.capacity) : "Not set",
      bookingContactEmail: firstClub.email ?? "bookings@gmail.com",
      typicalBookingNights: "Thursday, Friday, Saturday",
      clubGenres: [],
      artistNotes: firstClub.summary ?? "Share stage expectations and production details.",
    };
  } catch {
    return {};
  }
}

export function getSearchResultsFromMock(accountType: AccountType): SearchResult[] {
  try {
    const data = loadMockData();

    if (accountType === "artist") {
      return (data.clubs ?? []).map((club) => ({
        userId: club.user_id ?? "",
        name: club.name,
        city: club.city,
        summary: club.summary ?? "No summary provided",
        meta: club.capacity ? `Capacity: ${club.capacity}` : "Capacity not listed",
        email: club.email,
        availableDates: club.availableDates ?? [],
      }));
    }

    return (data.artists ?? []).map((artist) => ({
      userId: artist.user_id ?? "",
      name: artist.name,
      city: artist.city,
      summary: artist.summary ?? "No summary provided",
      meta: artist.genre
        ? `Genre: ${Array.isArray(artist.genre) ? artist.genre.join(", ") : artist.genre}`
        : "Genre not listed",
      email: artist.email,
      genres: normalizeMockGenres(artist.genre),
      artistDescription: artist.artistDescription ?? "",
      bandPicUrl: artist.bandPicUrl ?? "",
      youtube: artist.youtube ?? [],
    }));
  } catch {
    return [];
  }
}

export function getArtistByUserIdFromMock(userId: string): ArtistProfilePreview | null {
  try {
    const data = loadMockData();
    const artist = (data.artists ?? []).find((item) => item.user_id === userId);

    if (!artist) {
      return null;
    }

    return {
      userId: artist.user_id ?? "",
      name: artist.name,
      city: artist.city,
      summary: artist.summary ?? "No summary provided",
      artistDescription: artist.artistDescription ?? "No description provided.",
      genres: normalizeMockGenres(artist.genre),
      bandPicUrl: artist.bandPicUrl ?? "",
      youtube: artist.youtube ?? [],
    };
  } catch {
    return null;
  }
}

export function getArtistUserIdsFromMock(): string[] {
  const data = loadMockData();
  return (data.artists ?? []).map((artist) => artist.user_id ?? "").filter(Boolean);
}

export function getClubByUserIdFromMock(userId: string): ClubProfilePreview | null {
  try {
    const data = loadMockData();
    const club = (data.clubs ?? []).find((item) => item.user_id === userId);

    if (!club) {
      return null;
    }

    return {
      userId: club.user_id ?? "",
      name: club.name,
      city: club.city,
      summary: club.summary ?? "No summary provided",
      capacity: club.capacity ? String(club.capacity) : "Not listed",
      availableDates: club.availableDates ?? [],
    };
  } catch {
    return null;
  }
}

export function getClubUserIdsFromMock(): string[] {
  const data = loadMockData();
  return (data.clubs ?? []).map((club) => club.user_id ?? "").filter(Boolean);
}
