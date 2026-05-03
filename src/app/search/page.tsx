import Link from "next/link";

import { getArchivedClustersPage, searchArchivedClusters } from "@/lib/trends/archive";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const [results, archivePage] = await Promise.all([
    q ? searchArchivedClusters(q, 80) : Promise.resolve([]),
    q ? Promise.resolve({ data: [], hasNextPage: false, page: 1 }) : getArchivedClustersPage(1, 25),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">Chèche sijè tandans yo</h1>
          <Link href="/" className="text-sm text-cyan-200 hover:text-cyan-100">
            Retounen sou akèy la
          </Link>
        </div>

        <form action="/search" method="get" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Chèche sijè, kategori, oswa mo kle..."
              className="w-full rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-900"
            >
              Chèche
            </button>
          </div>
        </form>

        {q ? (
          <p className="text-sm text-slate-300">
            {results.length} rezilta pou <span className="text-white">{q}</span>
          </p>
        ) : null}

        {!q ? (
          <section className="rounded-2xl border border-cyan-300/30 bg-cyan-400/10 p-4 text-sm text-cyan-50">
            <p>
              Tout sijè yo rete sou sit la, menm lè yo pa sou premye paj la ankò. Browse tout achiv la
              sou{" "}
              <Link href="/news" className="font-semibold underline">
                paj nouvèl yo
              </Link>
              .
            </p>
          </section>
        ) : null}

        {q && results.length === 0 ? (
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            Nou pa jwenn okenn rezilta pou mo kle sa a. Ou ka gade tout achiv la sou{" "}
            <Link href="/news" className="text-cyan-200 underline">
              paj nouvèl yo
            </Link>
            .
          </section>
        ) : null}

        <div className="space-y-3">
          {q
            ? results.map((result) => (
                <Link
                  key={result.id}
                  href={`/cluster/${result.id}`}
                  className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/40"
                >
                  <h2 className="text-lg font-medium text-white">{result.title}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Kategori {result.trendCategory} • Dènye fwa wè{" "}
                    {new Date(result.lastSeenAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{result.summary}</p>
                </Link>
              ))
            : archivePage.data.map((result) => (
                <Link
                  key={result.id}
                  href={`/cluster/${result.id}`}
                  className="block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-300/40"
                >
                  <h2 className="text-lg font-medium text-white">{result.title}</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Kategori {result.trendCategory} • Dènye fwa wè{" "}
                    {new Date(result.lastSeenAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">{result.summary}</p>
                </Link>
              ))}
        </div>
      </div>
    </main>
  );
}

