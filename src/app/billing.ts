export const MVP_CLUB_BILLING_STORAGE_PREFIX = "bookemdanno.clubBilling.";

export function getClubBillingStorageKey(identifier: string): string {
  return `${MVP_CLUB_BILLING_STORAGE_PREFIX}${identifier.trim().toLowerCase()}`;
}

export function getClubBillingIdentifier(profile: {
  email?: string;
  username?: string;
  userId?: string;
}): string {
  return profile.email?.trim() || profile.username?.trim() || profile.userId?.trim() || "club-booker";
}

