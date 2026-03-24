import { Suspense } from "react";
import SignupPageClient from "./SignupPageClient";

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="noise-bg min-h-screen px-6 py-16" />}>
      <SignupPageClient />
    </Suspense>
  );
}
