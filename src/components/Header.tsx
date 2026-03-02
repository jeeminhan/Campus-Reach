export default function Header() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
      <div>
        <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">
          Campus
        </span>
        <h1 className="text-lg font-bold leading-tight text-white">Reach</h1>
      </div>
      <p className="hidden text-sm text-slate-400 md:block">
        International students · Unreached peoples
      </p>
    </header>
  );
}
