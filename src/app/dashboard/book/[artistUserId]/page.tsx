import { Suspense } from "react";
import { getArtistUserIdsFromMock } from "../../mock-data";
import BookArtistPageClient from "./BookArtistPageClient";

type BookArtistPageProps = {
  params: Promise<{ artistUserId: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const userIds = getArtistUserIdsFromMock();
  return userIds.map((artistUserId) => ({ artistUserId }));
}

export default async function BookArtistPage({ params }: BookArtistPageProps) {
  const { artistUserId } = await params;

  return (
    <Suspense fallback={<main className="min-h-screen py-10" />}>
      <BookArtistPageClient artistUserId={artistUserId} />
    </Suspense>
  );
}
