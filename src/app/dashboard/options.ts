export const genreOptions = [
  { label: "Rock", value: "rock" },
  { label: "Alternative/Indie", value: "alternative-indie" },
  { label: "Metal", value: "metal" },
  { label: "Punk", value: "punk" },
  { label: "Pop", value: "pop" },
  { label: "Hip-Hop/Rap", value: "hip-hop-rap" },
  { label: "R&B/Soul", value: "rnb-soul" },
  { label: "Country", value: "country" },
  { label: "Jazz", value: "jazz" },
  { label: "Blues", value: "blues" },
  { label: "Electronic/EDM", value: "electronic-edm" },
  { label: "Latin", value: "latin" },
] as const;

export const artistTypeOptions = [
  { label: "Musician/Band", value: "musician-band" },
  { label: "DJ", value: "dj" },
  { label: "Comedian", value: "comedian" },
  { label: "Magician", value: "magician" },
  { label: "Trivia Host", value: "trivia-host" },
  { label: "Other", value: "other" },
] as const;

export function artistTypeLabel(value: string): string {
  return artistTypeOptions.find((item) => item.value === value)?.label ?? "Musician/Band";
}

export const clubBookerTypeOptions = [
  { label: "Select Type", value: "select-type" },
  { label: "Venue/Club", value: "venue-club" },
  { label: "Promoter", value: "promoter" },
  { label: "Talent Buyer", value: "talent-buyer" },
  { label: "Private Event Booker", value: "private-event-booker" },
] as const;

export function clubBookerTypeLabel(value: string): string {
  return clubBookerTypeOptions.find((item) => item.value === value)?.label ?? "Select Type";
}
