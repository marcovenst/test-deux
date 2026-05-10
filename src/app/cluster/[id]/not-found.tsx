import Link from "next/link";

export default function ClusterNotFound() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-xl font-semibold text-white">Sijè sa a pa egziste ankò</h1>
        <p className="text-sm text-slate-400">
          Lyen an ka fin vye oubyen istorik la te retire. Eseye akèy la pou dènye tandans yo.
        </p>
        <Link href="/" className="inline-block text-sm text-cyan-200 hover:text-cyan-100">
          Ale sou akèy Zen Rezo A
        </Link>
      </div>
    </main>
  );
}
