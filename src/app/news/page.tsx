import Link from "next/link";

import { getArchivedClustersPage } from "@/lib/trends/archive";

export const dynamic = "force-dynamic";

type NewsArchivePageProps = {
  searchParams: Promise<{ page?: string }>;
};

function parsePage(input?: string) {
  const parsed = Number(input ?? "1");
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}

export default async function NewsArchivePage({ searchParams }: NewsArchivePageProps) {
  const params = await searchParams;
  const page = parsePage(params.page);
  const { data, hasNextPage } = await getArchivedClustersPage(page, 30);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold text-white">Achiv nouvèl yo</h1>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/search" className="text-cyan-200 hover:text-cyan-100">
              Chèche pa mo kle
            </Link>
            <Link href="/" className="text-cyan-200 hover:text-cyan-100">
              Retounen sou akèy la
            </Link>
          </div>
        </div>

        <section className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4 text-sm text-cyan-50">
          Paj sa a montre istwa ki gen plis pase 30 jou, pou ou toujou jwenn ansyen nouvèl yo.
        </section>

        <div className="space-y-3">
          {data.map((item) => (
            <Link
              key={item.id}
              href={`/cluster/${item.id}`}
              className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/40"
            >
              <h2 className="text-lg font-medium text-white">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-300">
                Kategori {item.trendCategory} • Premye fwa wè{" "}
                {new Date(item.firstSeenAt).toLocaleDateString()} • Dènye fwa wè{" "}
                {new Date(item.lastSeenAt).toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-slate-400">{item.summary}</p>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link
              href={`/news?page=${page - 1}`}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:border-cyan-300/50"
            >
              Paj avan
            </Link>
          ) : (
            <span />
          )}

          {hasNextPage ? (
            <Link
              href={`/news?page=${page + 1}`}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:border-cyan-300/50"
            >
              Paj apre
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}
