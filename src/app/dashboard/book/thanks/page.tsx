import { Suspense } from "react";
import ThankYouClient from "./ThankYouClient";

export default function BookThanksPage() {
  return (
    <Suspense fallback={<main className="min-h-screen py-10" />}>
      <ThankYouClient />
    </Suspense>
  );
}
