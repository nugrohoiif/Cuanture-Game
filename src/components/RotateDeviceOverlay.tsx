import { RotateCw, Smartphone } from 'lucide-react';

/** Full-screen orientation gate. There is intentionally no skip/start button. */
export function RotateDeviceOverlay() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-[#071420] px-5 py-6 text-white"
      data-testid="mobile-rotate-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-rotate-title"
      aria-describedby="mobile-rotate-description"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto my-auto flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-extrabold tracking-[0.25em] text-amber-300">
          CUANTURE · CUAN ADVENTURE
        </div>

        <div className="relative mb-7 grid h-36 w-36 place-items-center rounded-[2rem] border border-sky-400/30 bg-sky-400/10 shadow-[0_0_65px_rgba(56,189,248,0.12)]">
          <Smartphone
            aria-hidden="true"
            size={78}
            strokeWidth={1.7}
            className="cuanture-rotate-phone text-sky-200"
          />
          <div className="absolute -bottom-4 -right-3 rounded-full border border-amber-300/40 bg-[#162f43] p-3 text-amber-300">
            <RotateCw aria-hidden="true" size={28} strokeWidth={2.2} />
          </div>
        </div>

        <h1 id="mobile-rotate-title" className="mb-3 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
          Putar HP ke Samping
        </h1>
        <p id="mobile-rotate-description" className="max-w-xs text-sm leading-relaxed text-slate-300">
          Cuanture dimainkan dalam posisi <strong className="text-amber-300">landscape (horizontal)</strong>.
          Putar perangkat kamu untuk melanjutkan petualangan.
        </p>
        <div className="mt-6 rounded-xl border border-sky-400/25 bg-slate-800/80 px-4 py-3 text-xs leading-relaxed text-sky-100">
          Jika layar tidak ikut berputar, nonaktifkan <strong>kunci rotasi layar</strong> di pengaturan cepat HP.
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-amber-300">
          Game belum dapat dimulai sebelum landscape
        </p>
      </div>
    </div>
  );
}
