import { Suspense } from "react";
import BillingPageClient from "./BillingPageClient";

export default function BillingPage() {
  return (
    <Suspense fallback={<main className="min-h-screen py-10" />}>
      <BillingPageClient />
    </Suspense>
  );
}

