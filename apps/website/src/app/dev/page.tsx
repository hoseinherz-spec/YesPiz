import Link from "next/link";

const ARCHIVES = [
  {
    href: "/dev/yesplz",
    title: "Yesplz experimental landing",
    body: "Archived magnetic-cursor / craft-timeline experiment. Not the production marketing site.",
  },
] as const;

export default function DevArchiveIndexPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-semibold tracking-wide text-muted uppercase">
          Dev archive
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Landing experiments
        </h1>
        <p className="mt-3 text-muted">
          Production landing lives at{" "}
          <Link href="/" className="underline underline-offset-4">
            /
          </Link>
          . These routes are kept for design reference only.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {ARCHIVES.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-accent"
            >
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
