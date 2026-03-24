import { Suspense } from "react";
import HomePageClient from "./HomePageClient";

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen px-6 pt-[40px] pb-16" />}>
      <HomePageClient />
    </Suspense>
  );
}
