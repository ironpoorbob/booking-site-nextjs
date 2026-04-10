"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type ProfileReturnLinkProps = {
  fallbackHref: string;
};

export default function ProfileReturnLink({ fallbackHref }: ProfileReturnLinkProps) {
  const searchParams = useSearchParams();

  const { href, label } = useMemo(() => {
    const returnToRaw = searchParams.get("returnTo");
    const href = returnToRaw && returnToRaw.startsWith("/") ? returnToRaw : fallbackHref;

    return {
      href,
      label: href.startsWith("/dashboard?") ? "Back to Dashboard" : "Back to Search",
    };
  }, [fallbackHref, searchParams]);

  return (
    <Link className="btn-secondary" href={href}>
      {label}
    </Link>
  );
}
