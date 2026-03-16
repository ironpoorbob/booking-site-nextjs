import Link from "next/link";
import Image from "next/image";
import { withBasePath } from "@/lib/base-path";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="site-nav-wrap">
        <nav className="site-nav w-full">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between py-2">
            <Link className="site-brand" href="/">
              <Image
                src={withBasePath("/book-em-danno-logo.png")}
                alt="Book 'em, Danno! logo"
                width={260}
                height={173}
                className="h-auto w-40"
                priority
              />
            </Link>
            <Link className="site-nav-link" href="/login">
              Log Out
            </Link>
          </div>
        </nav>
      </header>
      {children}
    </>
  );
}
