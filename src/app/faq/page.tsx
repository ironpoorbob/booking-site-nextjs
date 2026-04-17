import { Suspense } from "react";
import FaqPageClient from "./FaqPageClient";

export default function FaqPage() {
  return (
    <Suspense fallback={<main className="min-h-screen py-10" />}>
      <FaqPageClient />
    </Suspense>
  );
}
