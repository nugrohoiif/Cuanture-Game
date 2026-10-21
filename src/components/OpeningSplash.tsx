import { useEffect, useState } from 'react';
import { soundFX } from '../game/sound';

export interface OpeningSplashProps {
  isVisible?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartAdventure: () => void;
}

export function OpeningSplash({
  isVisible = true,
  isMuted,
  onToggleMute,
  onStartAdventure,
}: OpeningSplashProps) {
  const [entered, setEntered] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setEntered(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      setEntered(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  // Unlock AudioContext on first user interaction inside the splash screen if music is enabled
  const handleUnlockAudio = () => {
    if (!isMuted) {
      soundFX.startMusic();
    }
  };

  const handleTriggerStart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();
    if (!isMuted) {
      soundFX.startMusic();
    }
    soundFX.playInteract();
    onStartAdventure();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="splash-screen-title"
      data-testid="opening-splash-overlay"
      onClick={handleUnlockAudio}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="cuanture-splash-overlay fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none pointer-events-auto overflow-hidden bg-gradient-to-b from-sky-200/80 via-amber-100/70 to-emerald-200/80 backdrop-blur-md"
    >
      {/* Decorative Low-Poly Pastel Clouds & Floating Island Motifs */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-75"
      >
        {/* Soft Pastel Sun Halo */}
        <circle cx="720" cy="240" r="240" fill="#fef3c7" opacity="0.65" />
        <circle cx="720" cy="240" r="165" fill="#fde68a" opacity="0.55" />

        {/* Left Low-Poly Pastel Cloud */}
        <g fill="#ffffff" opacity="0.85">
          <polygon points="110,230 165,185 240,195 275,230" />
          <polygon points="165,185 215,155 265,190 240,195" />
          <polygon points="85,230 135,200 165,185 110,230" />
        </g>

        {/* Right Low-Poly Pastel Cloud */}
        <g fill="#ffffff" opacity="0.85">
          <polygon points="1140,205 1205,160 1285,175 1320,205" />
          <polygon points="1205,160 1255,135 1300,170 1285,175" />
        </g>

        {/* Left Distant Low-Poly Floating Mini-Island */}
        <g opacity="0.7">
          <polygon points="140,620 260,620 230,645 165,645" fill="#86efac" />
          <polygon points="165,645 230,645 205,705" fill="#d97706" />
          <polygon points="140,620 165,645 205,705" fill="#b45309" />
        </g>

        {/* Right Distant Low-Poly Floating Mini-Island */}
        <g opacity="0.7">
          <polygon points="1180,590 1300,590 1275,615 1205,615" fill="#6ee7b7" />
          <polygon points="1205,615 1275,615 1245,680" fill="#d97706" />
          <polygon points="1180,590 1205,615 1245,680" fill="#92400e" />
        </g>
      </svg>

      {/* Main Pastel 3D Low-Poly Adventure Splash Card */}
      <div
        data-testid="splash-screen-card"
        className={`cuanture-splash-card relative w-full max-w-md sm:max-w-lg rounded-3xl bg-gradient-to-b from-[#fffdf7] via-[#f8fafc] to-[#ecfdf5] border-4 border-amber-300 shadow-[0_24px_60px_rgba(15,23,42,0.35),0_8px_0_#d97706] px-5 py-6 sm:px-8 sm:py-8 text-center flex flex-col items-center gap-4 sm:gap-5 transition-all duration-700 ease-out motion-reduce:transition-none ${
          entered
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-95'
        }`}
      >
        {/* Top Metadata & Music Toggle Row */}
        <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-sky-900 tracking-tight whitespace-nowrap">
            <span>3D Pastel Adventure</span>
            <span aria-hidden="true">·</span>
            <span>Aether Isle</span>
          </div>

          <button
            type="button"
            data-testid="splash-music-toggle-btn"
            aria-label={isMuted ? 'Aktifkan Musik Petualangan' : 'Matikan Musik Petualangan'}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onToggleMute();
            }}
            className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isMuted
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400'
            }`}
          >
            <span aria-hidden="true">{isMuted ? '🔇' : '🎵'}</span>
            <span>{isMuted ? 'Musik: Mati' : 'Musik: Aktif'}</span>
          </button>
        </div>

        {/* Centerpiece Official CUANTURE Logo with White Background & Subtle Entrance Animation */}
        <div
          data-testid="opening-splash-logo-wrapper"
          className={`relative transition-all duration-700 delay-100 ease-out motion-reduce:transition-none ${
            entered ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-3 scale-90'
          }`}
        >
          {/* Decorative Soft Pastel Glow Behind Logo Frame */}
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-amber-300/60 via-emerald-300/50 to-sky-300/60 blur-md pointer-events-none" />

          {/* Official Logo Container Preserving Clean White Background */}
          <div className="cuanture-splash-logo relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl bg-white p-3 sm:p-4 border-4 border-amber-400 shadow-[0_12px_28px_rgba(180,83,9,0.18)] flex items-center justify-center overflow-hidden">
            {!logoError ? (
              <img
                src="/assets/cuanture-logo.png"
                alt="CUANTURE — Cuan Adventure Logo"
                referrerPolicy="no-referrer"
                data-testid="splash-cuanture-logo"
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain select-none"
              />
            ) : (
              <div
                data-testid="splash-cuanture-logo-fallback"
                className="w-full h-full rounded-xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 flex flex-col items-center justify-center p-3 text-center"
              >
                <span className="text-2xl font-extrabold text-amber-600 tracking-tight">
                  CUANTURE
                </span>
                <span className="text-xs font-semibold text-emerald-700 mt-1">
                  Cuan Adventure
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Game Title & Pastel Adventure Subtitle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800">
            <span>Game Petualangan Edukasi Pasar Modal Indonesia</span>
          </div>
          <h1
            id="splash-screen-title"
            data-testid="splash-screen-title"
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 text-balance"
          >
            CUANTURE: Cuan Adventure
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-sm mx-auto leading-relaxed">
            Petualangan Seru Mengenal Pasar Modal di pulau terapung{' '}
            <strong className="text-slate-800">Aether Isle</strong>. Kenali profil risikomu dan
            bangun portofolio investasi cerdas!
          </p>
        </div>

        {/* Primary CTA Button: Mulai Petualangan */}
        <div className="w-full pt-1">
          <button
            type="button"
            data-testid="splash-start-btn"
            onClick={handleTriggerStart}
            className="w-full min-h-[48px] py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:via-teal-500 hover:to-sky-500 active:translate-y-0.5 text-white font-extrabold text-base sm:text-lg tracking-wide border-b-4 border-emerald-800 shadow-[0_10px_24px_rgba(16,185,129,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span>Mulai Petualangan</span>
            <span aria-hidden="true" className="text-lg leading-none">
              →
            </span>
          </button>
          <p className="mt-2 text-xs text-slate-600 font-medium">
            Tekan <span className="font-mono font-bold text-slate-800">Mulai Petualangan</span> atau
            tombol <span className="font-mono font-bold text-slate-800">Enter</span> untuk membuka
            panduan
          </p>
        </div>
      </div>
    </div>
  );
}
