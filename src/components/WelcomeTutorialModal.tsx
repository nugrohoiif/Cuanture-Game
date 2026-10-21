import { WELCOME_TUTORIAL_CONTENT } from '../game/market';
import type { LightingPreset } from './StudioEnvironment';

export { WELCOME_TUTORIAL_CONTENT };

interface WelcomeTutorialModalProps {
  lightingPreset: LightingPreset;
  onStartGame: () => void;
  onChangeLighting: (preset: LightingPreset) => void;
}

export function WelcomeTutorialModal({
  lightingPreset,
  onStartGame,
  onChangeLighting,
}: WelcomeTutorialModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-tutorial-title"
      data-testid="welcome-tutorial-overlay"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none pointer-events-auto"
    >
      <div
        data-testid="welcome-tutorial-modal"
        className="w-11/12 max-w-xl max-h-[94vh] overflow-y-auto rounded-2xl bg-[#0b1628]/95 border-2 border-amber-400/60 shadow-[0_24px_70px_rgba(0,0,0,0.85)] p-3.5 sm:p-6 md:p-7 text-slate-100 flex flex-col justify-between gap-2.5 sm:gap-4"
      >
        {/* Top Header Badge & Sky Theme Selector */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 sm:pb-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest">
            <span>🏛️</span>
            <span>Edukasi & Simulasi Pasar Modal Indonesia</span>
          </div>

          <button
            type="button"
            data-testid="welcome-sky-preset-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              onChangeLighting(
                lightingPreset === 'morning'
                  ? 'noon'
                  : lightingPreset === 'noon'
                  ? 'sunset'
                  : 'morning'
              );
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-600/70 text-[10px] sm:text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            Cuaca:{' '}
            {lightingPreset === 'morning'
              ? 'Pagi Cerah'
              : lightingPreset === 'noon'
              ? 'Siang Hari'
              : 'Senja Emas'}
          </button>
        </div>

        {/* Hero Header with Official CUANTURE — Cuan Adventure Logo & Title */}
        <div className="flex items-center gap-3 sm:gap-5 bg-slate-900/75 border border-amber-400/35 rounded-2xl p-2 sm:p-3.5 shadow-inner">
          <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl bg-white p-1 sm:p-1.5 border-2 border-amber-400/85 shadow-lg shrink-0 flex items-center justify-center overflow-hidden">
            <img
              src="/assets/cuanture-logo.png"
              alt="CUANTURE — Cuan Adventure Logo"
              data-testid="welcome-cuanture-logo"
              className="w-full h-full object-contain select-none"
            />
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/45 text-emerald-300 text-[9px] sm:text-xs font-extrabold uppercase tracking-wider mb-0.5 sm:mb-1">
              <span>CUANTURE · CUAN ADVENTURE</span>
            </div>
            <h1
              id="welcome-tutorial-title"
              data-testid="welcome-tutorial-title"
              className="text-base sm:text-2xl md:text-3xl font-extrabold font-display tracking-tight text-white leading-tight"
            >
              {WELCOME_TUTORIAL_CONTENT.title}
            </h1>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm text-sky-300 font-semibold">
              Aether Isle · Petualangan Edukasi Pasar Modal
            </p>
          </div>
        </div>

        {/* Onboarding Cards: Objective, Controls, First Mission */}
        <div className="space-y-2 sm:space-y-3">
          {/* 1. The Objective */}
          <div
            data-testid="welcome-objective-section"
            className="rounded-xl bg-slate-900/90 border border-emerald-500/40 p-2.5 sm:p-3.5"
          >
            <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                🎯 Objektif Utama
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-300">
                Modal Awal: Rp 10.000.000
              </span>
            </div>
            <p
              data-testid="welcome-objective-text"
              className="text-xs sm:text-sm text-slate-200 leading-snug sm:leading-relaxed"
            >
              {WELCOME_TUTORIAL_CONTENT.objective}
            </p>
          </div>

          {/* 2. The Controls */}
          <div
            data-testid="welcome-controls-section"
            className="rounded-xl bg-slate-900/90 border border-sky-500/40 p-2.5 sm:p-3.5"
          >
            <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
              <span className="px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-extrabold uppercase tracking-wider">
                🎮 Kontrol & Navigasi
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                WASD / Joystick + Tombol E / Interaksi
              </span>
            </div>
            <p
              data-testid="welcome-controls-text"
              className="text-xs sm:text-sm text-slate-200 leading-snug sm:leading-relaxed"
            >
              {WELCOME_TUTORIAL_CONTENT.controls}
            </p>
          </div>

          {/* 3. First Mission */}
          <div
            data-testid="welcome-mission-section"
            className="rounded-xl bg-amber-950/45 border-2 border-amber-400/75 p-2.5 sm:p-3.5 shadow-inner"
          >
            <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                🧭 Misi Pertama
              </span>
              <span className="text-[11px] font-bold text-amber-300">
                Kios Konsultan Keuangan (Dekat Titik Awal)
              </span>
            </div>
            <p
              data-testid="welcome-mission-text"
              className="text-xs sm:text-sm font-bold text-amber-100 leading-snug sm:leading-relaxed"
            >
              {WELCOME_TUTORIAL_CONTENT.firstMission}
            </p>
          </div>
        </div>

        {/* Prominent 'Mulai Bermain' (Start Game) Button at the Bottom */}
        <div className="pt-0.5 sm:pt-1">
          <button
            type="button"
            data-start="true"
            data-testid="welcome-start-btn"
            onClick={(e) => {
              e.currentTarget.blur();
              onStartGame();
            }}
            className="w-full py-3 sm:py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 hover:from-amber-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-extrabold text-sm sm:text-base md:text-lg tracking-wide shadow-[0_10px_30px_rgba(245,158,11,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{WELCOME_TUTORIAL_CONTENT.startButtonLabel}</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
