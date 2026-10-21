import { useState, useEffect } from 'react';
import {
  CAPITAL_MARKET_POIS,
  DEFAULT_GAME_SETTINGS,
  worldToMinimapPoint,
  yawToMinimapDegrees,
  getActiveMissionTargetPOI,
  type AetherShard,
  type CapitalMarketPOI,
  type GameSettings,
  type GraphicsQuality,
} from '../game/physics';
import {
  formatIDR,
  SHARES_PER_LOT,
  MARKET_REGULATOR_STRUCTURE,
} from '../game/market';
import { useMarket } from '../game/MarketContext';
import type { TelemetrySnapshot } from './PlayerCharacter';
import type { LightingPreset } from './StudioEnvironment';
import { MobileTouchControls } from './MobileTouchControls';
import { TradingTerminal } from './TradingTerminal';
import { RiskProfileModal } from './RiskProfileModal';
import { MutualFundMissionModal } from './MutualFundMissionModal';
import { KpeiMissionModal } from './KpeiMissionModal';
import { WelcomeTutorialModal } from './WelcomeTutorialModal';

interface GameHUDProps {
  gameState: 'title' | 'title-dummy' | 'playing' | 'paused' | 'gameover';
  isSplashVisible?: boolean;
  freeRoam: boolean;
  shards: AetherShard[];
  telemetry: TelemetrySnapshot;
  nearbyPOI: CapitalMarketPOI | null;
  activeModalPOI: CapitalMarketPOI | null;
  cameraMode: 'follow' | 'orbit';
  lightingPreset: LightingPreset;
  isMuted: boolean;
  settings?: GameSettings;
  elapsedSeconds: number;
  victorySnapshot: {
    clearTime: number;
    peakSpeed: number;
    respawns: number;
  } | null;
  lastCollectedShardName: string | null;
  onStartGame: () => void;
  onResumeGame: () => void;
  onPauseToggle: () => void;
  onResetPlayer: () => void;
  onVisitPOI: (poi: CapitalMarketPOI) => void;
  onOpenPOIModal: () => void;
  onClosePOIModal: () => void;
  onRestartRun: () => void;
  onEnterFreeRoam: () => void;
  onReturnTitle: () => void;
  onToggleCameraMode: () => void;
  onChangeLighting: (preset: LightingPreset) => void;
  onToggleMute: () => void;
  onDismissSplash?: () => void;
  onUpdateSettings?: (patch: Partial<GameSettings>) => void;
  onResetSettings?: () => void;
}

function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function GameHUD({
  gameState,
  isSplashVisible = false,
  freeRoam,
  shards,
  telemetry,
  nearbyPOI,
  activeModalPOI,
  cameraMode,
  lightingPreset,
  isMuted,
  settings = DEFAULT_GAME_SETTINGS,
  elapsedSeconds,
  victorySnapshot,
  lastCollectedShardName,
  onStartGame,
  onResumeGame,
  onPauseToggle,
  onResetPlayer,
  onVisitPOI,
  onOpenPOIModal,
  onClosePOIModal,
  onRestartRun,
  onEnterFreeRoam,
  onReturnTitle,
  onToggleCameraMode,
  onChangeLighting,
  onToggleMute,
  onDismissSplash,
  onUpdateSettings,
  onResetSettings,
}: GameHUDProps) {
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [trailingStamina, setTrailingStamina] = useState(100);
  const [showNewsTooltip, setShowNewsTooltip] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    balance,
    portfolio,
    stocks,
    riskProfile,
    activeNews,
    totalEquity,
    dismissNewsBanner,
    clearSaveAndResetMarket,
  } = useMarket();

  const collectedCount = shards.filter((s) => s.collected).length;
  const totalShards = shards.length;
  const totalSharesOwned =
    (portfolio.BBCA ?? 0) + (portfolio.TLKM ?? 0) + (portfolio.GOTO ?? 0);

  const activePOI = nearbyPOI;
  const isFirstMissionComplete = Boolean(riskProfile);
  const activeMissionTargetPOI = getActiveMissionTargetPOI(isFirstMissionComplete);
  const playerMinimapPoint = worldToMinimapPoint(telemetry.x, telemetry.z);
  const playerMinimapDeg = yawToMinimapDegrees(telemetry.yaw ?? Math.PI);
  const centralMonumentPoint = worldToMinimapPoint(0, -2);
  const activeTargetMinimapPoint = activeMissionTargetPOI
    ? worldToMinimapPoint(activeMissionTargetPOI.x, activeMissionTargetPOI.z)
    : null;

  // Delayed trailing ghost bar for stamina drain
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTrailingStamina(telemetry.stamina);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [telemetry.stamina]);

  // Keyboard shortcut 'H' to collapse/expand bottom dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH' && (gameState === 'playing' || freeRoam) && !activeModalPOI) {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, freeRoam, activeModalPOI]);

  // 1. OPENING SPLASH SCREEN (rendered in App.tsx) -> WELCOME & TUTORIAL OVERLAY SCREEN
  if (gameState === 'title') {
    if (isSplashVisible) {
      return null;
    }
    return (
      <WelcomeTutorialModal
        lightingPreset={lightingPreset}
        onStartGame={onStartGame}
        onChangeLighting={onChangeLighting}
      />
    );
  }

  return (
    <div
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="cuanture-game-hud fixed inset-0 z-10 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-4 md:p-6"
    >
      {/* =====================================================================
          HIGHLY VISIBLE TOP-OF-SCREEN 'BREAKING NEWS' MACROECONOMIC TICKER BANNER
      ===================================================================== */}
      {activeNews && !activeModalPOI && (
        <div
          role="status"
          aria-live="polite"
          data-testid="breaking-news-banner"
          className={`fixed left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-2xl pointer-events-auto transition-all duration-200 ${
            activePOI ? 'top-[13.5rem] sm:top-24 md:top-28' : 'top-[13.5rem] sm:top-3'
          }`}
        >
          <div
            className={`relative rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-2xl border-2 flex items-center justify-between gap-3 ${
              activeNews.event.impact.effect >= 1
                ? 'bg-[#091926]/96 border-emerald-400/85 text-slate-100'
                : 'bg-[#220914]/96 border-rose-400/85 text-slate-100'
            }`}
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-extrabold text-[10px] sm:text-xs uppercase tracking-widest animate-pulse shrink-0 shadow">
                BREAKING NEWS
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {activeNews.event.category}
                  </span>
                  <span
                    data-testid="breaking-news-impact-badge"
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                      activeNews.event.impact.effect >= 1
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-rose-400 text-slate-950'
                    }`}
                  >
                    {activeNews.event.impact.ticker}{' '}
                    {activeNews.event.impact.effect >= 1 ? '+' : ''}
                    {Math.round((activeNews.event.impact.effect - 1) * 100)}% (
                    {activeNews.remainingTicks} ticks)
                  </span>
                </div>
                <p
                  data-testid="breaking-news-headline"
                  className="text-xs sm:text-sm font-extrabold text-white leading-snug truncate sm:whitespace-normal"
                >
                  {activeNews.event.headline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Info Tooltip explaining why this macroeconomic indicator affects the market */}
              <div
                className="relative"
                onMouseEnter={() => setShowNewsTooltip(true)}
                onMouseLeave={() => setShowNewsTooltip(false)}
              >
                <button
                  type="button"
                  data-testid="news-info-tooltip-trigger"
                  aria-label="Info Indikator Makroekonomi"
                  onClick={() => setShowNewsTooltip((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/70 text-sky-200 text-xs font-extrabold cursor-pointer transition-colors"
                >
                  <span>ⓘ</span>
                  <span className="hidden sm:inline">Info</span>
                </button>

                {showNewsTooltip && (
                  <div
                    role="tooltip"
                    data-testid="news-info-tooltip-content"
                    className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-88 p-3.5 rounded-xl bg-[#07111e] border-2 border-sky-400/85 shadow-2xl text-xs text-slate-100 leading-relaxed"
                  >
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                      ANALISIS MAKROEKONOMI · {activeNews.event.indicatorTitle}
                    </div>
                    <p>{activeNews.event.tooltipExplanation}</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label="Dismiss Breaking News"
                onClick={dismissNewsBanner}
                className="px-2 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP PERIMETER ROW: Top-Left Shard/Capital/Risk-Profile Cluster, Center Active POI Banner, & Top-Right Utility Actions */}
      <div className="flex items-start justify-between gap-2 sm:gap-4 w-full">
        {/* Top-Left World-Matched Status, Balance & Permanent Risk Profile Badge Cluster */}
        <div
          data-testid="hud-status-cluster"
          className="cuanture-hud-status pointer-events-auto bg-[#0b1524]/92 border border-sky-400/35 rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 shadow-xl text-slate-100 w-[205px] sm:w-auto sm:min-w-[270px] shrink-0"
        >
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Code-Authored SVG Aether Shard Icon */}
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 sm:w-8 sm:h-8 shrink-0"
                aria-hidden="true"
              >
                <polygon
                  points="12,1 21,10 12,23 3,10"
                  fill="#082f49"
                  stroke="#020617"
                  strokeWidth="2"
                />
                <polygon points="12,3 19,10 12,21 5,10" fill="#0ea5e9" />
                <polygon points="12,3 17,10 12,15" fill="#bae6fd" />
                <circle cx="12" cy="10" r="2" fill="#fef08a" />
              </svg>
              <div>
                <div className="text-[8px] sm:text-[10px] font-bold tracking-wider uppercase text-sky-300 whitespace-nowrap">
                  AETHER SHARDS
                </div>
                <div
                  data-testid="shard-counter"
                  className="text-base sm:text-xl font-extrabold font-mono tabular-nums leading-none text-white whitespace-nowrap"
                  style={{ paintOrder: 'stroke fill' }}
                >
                  {Math.round(collectedCount)} / {Math.round(totalShards)}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[8px] sm:text-[10px] font-bold tracking-wider uppercase text-amber-300 whitespace-nowrap">
                TIME
              </div>
              <div className="text-xs sm:text-base font-bold font-mono tabular-nums leading-tight text-slate-100 whitespace-nowrap">
                {formatDuration(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Investor Balance + Permanent Risk Profile Badge Next to Balance */}
          <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
            <div>
              <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                CASH BALANCE ({Math.round(totalSharesOwned / SHARES_PER_LOT)} LOT)
              </div>
              <div
                data-testid="hud-cash-balance"
                className="text-[11px] sm:text-sm font-extrabold font-mono tabular-nums text-white whitespace-nowrap"
              >
                {formatIDR(balance)}
              </div>
            </div>

            {/* Permanent Small Risk Profile Badge + 'Mulai Ulang' (Reset Game) Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                data-testid="hud-risk-profile-badge"
                className={`px-2 py-1 rounded-lg border text-[10px] sm:text-xs font-extrabold tracking-wide whitespace-nowrap shrink-0 ${
                  riskProfile
                    ? riskProfile.shortLabel === 'Konservatif'
                      ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                      : riskProfile.shortLabel === 'Moderat'
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                      : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                    : 'bg-slate-800/90 border-slate-600/70 text-slate-300'
                }`}
              >
                {riskProfile ? riskProfile.badgeText : 'Profil: Belum Tes'}
              </div>

              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-reset-game-btn"
                title="Mulai Ulang (Reset Save Data)"
                onClick={(e) => {
                  e.currentTarget.blur();
                  setShowResetConfirm(true);
                }}
                className="px-2 py-1 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-400/60 text-rose-200 hover:text-white text-[10px] sm:text-xs font-extrabold tracking-wide transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Mulai Ulang
              </button>
            </div>
          </div>

          {/* Continuous Stamina / Boost Bar with Delayed Trailing Drain Ghost Bar */}
          <div className="mt-1.5 sm:mt-2">
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-bold tracking-wider uppercase text-slate-300 mb-0.5 sm:mb-1">
              <span>SPRINT ENERGY</span>
              <span className="font-mono tabular-nums">{Math.round(telemetry.stamina)}%</span>
            </div>
            <div className="relative h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div
                className="absolute inset-y-0 left-0 bg-amber-300/60 transition-all duration-200"
                style={{ width: `${Math.round(trailingStamina)}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-sky-400"
                style={{ width: `${Math.round(telemetry.stamina)}%` }}
              />
            </div>
          </div>

          {/* First Mission Indicator (Derived from riskProfile) */}
          <div
            data-testid="hud-first-mission-indicator"
            data-mission-complete={isFirstMissionComplete ? 'true' : 'false'}
            className={`mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-800/90 rounded-lg px-2 py-1.5 border ${
              isFirstMissionComplete
                ? 'bg-emerald-950/40 border-emerald-400/55 text-emerald-100'
                : 'bg-amber-950/40 border-amber-400/50 text-amber-100'
            }`}
          >
            {!isFirstMissionComplete ? (
              <div className="flex items-start gap-1.5 max-w-[240px] sm:max-w-[270px]">
                <span
                  aria-hidden="true"
                  className="text-amber-300 text-[11px] sm:text-xs leading-tight shrink-0 mt-0.5"
                >
                  🎯
                </span>
                <div className="min-w-0">
                  <div
                    data-testid="hud-first-mission-title"
                    className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-amber-300 leading-tight"
                  >
                    MISI PERTAMA
                  </div>
                  <p
                    data-testid="hud-first-mission-text"
                    className="text-[10px] sm:text-[11px] font-medium text-slate-200 leading-snug mt-0.5"
                  >
                    Kunjungi Kios Konsultan Keuangan dan selesaikan Tes Profil Risiko.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-1.5 max-w-[240px] sm:max-w-[270px]">
                <span
                  aria-hidden="true"
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/25 border border-emerald-400/70 text-emerald-300 text-[10px] font-extrabold shrink-0 mt-0.5"
                >
                  ✓
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      data-testid="hud-first-mission-title"
                      className="text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-emerald-300 leading-tight"
                    >
                      MISI PERTAMA SELESAI
                    </span>
                    {riskProfile && (
                      <span
                        data-testid="hud-first-mission-profile"
                        className="px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-400/50 text-[8px] sm:text-[9px] font-bold text-emerald-200 whitespace-nowrap"
                      >
                        Profil Risiko: {riskProfile.shortLabel}
                      </span>
                    )}
                  </div>
                  <p
                    data-testid="hud-first-mission-text"
                    className="text-[10px] sm:text-[11px] font-medium text-slate-200 leading-snug mt-0.5"
                  >
                    Kamu berhasil mengetahui profil risiko investasimu!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Active Capital Market POI Banner + Interactive 'Press E to Interact' Prompt */}
        {activePOI && !activeModalPOI ? (
          <div
            data-testid="active-poi-banner"
            className="cuanture-desktop-poi-banner hidden md:flex flex-col items-center bg-[#0b1524] border border-amber-400/65 px-5 py-2.5 rounded-xl shadow-xl text-center max-w-md pointer-events-auto"
          >
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
              CAPITAL MARKET ZONE · {activePOI.englishName.toUpperCase()}
            </div>
            <div className="text-base font-extrabold text-white font-['Outfit']">
              {activePOI.name}
            </div>
            <button
              type="button"
              data-testid="interact-prompt-button"
              onClick={(e) => {
                e.currentTarget.blur();
                onOpenPOIModal();
              }}
              className="mt-1.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs tracking-wide transition-colors cursor-pointer shadow"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-950 text-amber-300 font-mono text-xs font-black">
                E
              </span>
              <span data-testid="floating-3d-prompt">Press E to Interact</span>
            </button>
          </div>
        ) : lastCollectedShardName && !activeModalPOI ? (
          <div className="hidden lg:flex items-center gap-2 bg-[#0b1524]/92 border border-amber-400/50 text-amber-200 px-4 py-2 rounded-xl shadow-lg text-xs font-semibold whitespace-nowrap">
            <span>Shard Resonated:</span>
            <span className="text-white font-bold">{lastCollectedShardName}</span>
          </div>
        ) : null}

        {/* Top-Right Column: Compact Utility Icon Buttons + 2D Island Radar Minimap */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
          <div className="pointer-events-auto flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Switch Camera Mode (Current: ${cameraMode === 'follow' ? 'Third-Person Follow' : 'Orbit Follow'})`}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleCameraMode();
              }}
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-[#0b1524]/92 hover:bg-slate-800 border border-sky-400/35 text-slate-100 flex items-center justify-center gap-2 text-xs font-semibold shadow-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-sky-400" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="hidden sm:inline">
                {cameraMode === 'follow' ? '3rd-Person Cam [C]' : 'Orbit Cam [C]'}
              </span>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Reset Player to Spawn Plaza [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                onResetPlayer();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0b1524]/92 hover:bg-slate-800 border border-sky-400/35 text-slate-100 flex items-center justify-center shadow-lg transition-colors cursor-pointer shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2.2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0b1524]/92 hover:bg-slate-800 border border-sky-400/35 text-slate-100 flex items-center justify-center shadow-lg transition-colors cursor-pointer shrink-0"
            >
              {isMuted ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-rose-400" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-sky-400" strokeWidth="2.2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            <button
              type="button"
              tabIndex={-1}
              data-testid="open-settings-btn"
              aria-label="Pause & Settings [P]"
              onClick={(e) => {
                e.currentTarget.blur();
                onPauseToggle();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0b1524]/92 hover:bg-slate-800 border border-sky-400/35 text-slate-100 flex items-center justify-center shadow-lg transition-colors cursor-pointer shrink-0"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2.2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>

          {/* 2D ISLAND RADAR MINIMAP (Player Position, 5 Capital Market POIs & Active Task Target) */}
          <div
            data-testid="hud-minimap"
            aria-label="2D Island Minimap"
            className="cuanture-hud-minimap pointer-events-auto w-[124px] sm:w-44 bg-[#0b1524]/92 border border-sky-400/35 rounded-xl p-1.5 sm:p-2.5 shadow-xl text-slate-100"
          >
            {/* Minimap Header */}
            <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
              <span className="text-[8px] sm:text-[10px] font-extrabold uppercase tracking-wider text-sky-300">
                MINIMAP
              </span>
              <span
                data-testid="minimap-coords"
                className="text-[8px] sm:text-[10px] font-mono font-bold tabular-nums text-slate-300"
              >
                {Math.round(telemetry.x)}, {Math.round(telemetry.z)}
              </span>
            </div>

            {/* 2D Top-Down Radar Surface */}
            <div
              data-testid="minimap-radar"
              className="relative w-full aspect-square rounded-lg sm:rounded-xl bg-[#06101d] border border-sky-500/30 overflow-hidden shadow-inner"
            >
              {/* Island Coastline, Contour Rings & Guide Line SVG */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full pointer-events-none"
                aria-hidden="true"
              >
                {/* Outer Floating Island Terrene Disc (R=18m -> r=40%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="#0c2d34"
                  fillOpacity="0.65"
                  stroke="#34d399"
                  strokeOpacity="0.4"
                  strokeWidth="1"
                />
                {/* Inner Sanctuary Plaza Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="23"
                  fill="none"
                  stroke="#38bdf8"
                  strokeOpacity="0.22"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                />
                {/* Cardinal Crosshairs */}
                <line
                  x1="50"
                  y1="10"
                  x2="50"
                  y2="90"
                  stroke="#38bdf8"
                  strokeOpacity="0.16"
                  strokeWidth="0.6"
                />
                <line
                  x1="10"
                  y1="50"
                  x2="90"
                  y2="50"
                  stroke="#38bdf8"
                  strokeOpacity="0.16"
                  strokeWidth="0.6"
                />

                {/* Dashed Navigation Guide Line from Player to Active Mission Target POI */}
                {activeTargetMinimapPoint && (
                  <line
                    data-testid="minimap-target-line"
                    x1={playerMinimapPoint.leftPct}
                    y1={playerMinimapPoint.topPct}
                    x2={activeTargetMinimapPoint.leftPct}
                    y2={activeTargetMinimapPoint.topPct}
                    stroke="#fbbf24"
                    strokeWidth="1.3"
                    strokeDasharray="3 2"
                    strokeOpacity="0.9"
                  />
                )}
              </svg>

              {/* Cardinal Direction Labels */}
              <span
                aria-hidden="true"
                className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-extrabold text-amber-300/90 leading-none pointer-events-none"
              >
                N
              </span>
              <span
                aria-hidden="true"
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] sm:text-[8px] font-bold text-slate-400/80 leading-none pointer-events-none"
              >
                S
              </span>
              <span
                aria-hidden="true"
                className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] sm:text-[8px] font-bold text-slate-400/80 leading-none pointer-events-none"
              >
                W
              </span>
              <span
                aria-hidden="true"
                className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] sm:text-[8px] font-bold text-slate-400/80 leading-none pointer-events-none"
              >
                E
              </span>

              {/* Central Bullish Stock Chart Monument Landmark Marker at (0, -2) */}
              <div
                data-testid="minimap-central-monument"
                title="Monumen Grafik Saham Naik (Pusat Pulau)"
                style={{
                  left: `${centralMonumentPoint.leftPct}%`,
                  top: `${centralMonumentPoint.topPct}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-emerald-500/30 border border-emerald-400/80 flex items-center justify-center pointer-events-none"
              >
                <div className="w-1 h-1 bg-amber-300 rounded-full" />
              </div>

              {/* 5 Capital Market POI Markers */}
              {CAPITAL_MARKET_POIS.map((poi) => {
                const pt = worldToMinimapPoint(poi.x, poi.z);
                const isNearby = activePOI?.id === poi.id;
                const isMissionTarget = activeMissionTargetPOI?.id === poi.id;
                const shortTag =
                  poi.id === 'bursa-efek'
                    ? 'BEI'
                    : poi.id === 'perusahaan-sekuritas'
                      ? 'SEK'
                      : poi.id === 'pusat-reksa-dana'
                        ? 'RD'
                        : poi.id === 'pusat-regulator'
                          ? 'OJK'
                          : poi.id === 'kpei'
                            ? 'KPEI'
                            : poi.id === 'ksei'
                              ? 'KSEI'
                              : 'KONS';

                return (
                  <button
                    key={poi.id}
                    type="button"
                    tabIndex={-1}
                    data-testid={`minimap-poi-${poi.id}`}
                    data-poi-active={isNearby ? 'true' : 'false'}
                    data-mission-target={isMissionTarget ? 'true' : 'false'}
                    title={`${poi.name} (${poi.shortLabel})${isMissionTarget ? ' — TARGET MISI AKTIF' : ''}`}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onVisitPOI(poi);
                    }}
                    style={{
                      left: `${pt.leftPct}%`,
                      top: `${pt.topPct}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center justify-center cursor-pointer focus:outline-none z-10"
                  >
                    {/* Active Mission Target Pulsing Ring */}
                    {isMissionTarget && (
                      <span
                        data-testid="minimap-active-target"
                        data-target-poi-id={poi.id}
                        className="absolute -inset-1.5 sm:-inset-2 rounded-full border-2 border-amber-300 bg-amber-400/20 animate-ping pointer-events-none"
                      />
                    )}
                    {isMissionTarget && (
                      <span className="absolute -inset-1 sm:-inset-1.5 rounded-full border-2 border-amber-400 shadow-[0_0_8px_#fbbf24] pointer-events-none" />
                    )}

                    {/* POI Node Circle */}
                    <span
                      style={{ backgroundColor: poi.themeColor }}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border transition-transform group-hover:scale-125 ${
                        isNearby
                          ? 'border-white scale-125 ring-2 ring-emerald-400'
                          : isMissionTarget
                            ? 'border-amber-200 scale-110'
                            : 'border-slate-950/90'
                      }`}
                    />

                    {/* Compact Tag on Desktop */}
                    <span
                      className={`hidden sm:block mt-0.5 px-1 rounded text-[7px] font-extrabold leading-tight whitespace-nowrap pointer-events-none ${
                        isMissionTarget
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : isNearby
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-950/85 text-slate-200'
                      }`}
                    >
                      {shortTag}
                    </span>
                  </button>
                );
              })}

              {/* Live Player Position & Orientation Marker */}
              <div
                data-testid="minimap-player-marker"
                data-player-x={Math.round(telemetry.x * 10) / 10}
                data-player-z={Math.round(telemetry.z * 10) / 10}
                data-player-deg={playerMinimapDeg}
                style={{
                  left: `${playerMinimapPoint.leftPct}%`,
                  top: `${playerMinimapPoint.topPct}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              >
                <div
                  data-testid="minimap-player-arrow"
                  style={{ transform: `rotate(${playerMinimapDeg}deg)` }}
                  className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center drop-shadow-[0_0_4px_rgba(56,189,248,0.95)]"
                >
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <polygon
                      points="12,2 20,20 12,15.5 4,20"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Mission Target Status Footer */}
            <div
              data-testid="minimap-target-status"
              data-target-poi={activeMissionTargetPOI?.id ?? 'completed'}
              className={`mt-1.5 rounded-lg px-1.5 py-1 border text-[8px] sm:text-[9px] font-bold leading-tight flex items-center justify-between gap-1 ${
                activeMissionTargetPOI
                  ? 'bg-amber-950/55 border-amber-400/60 text-amber-200'
                  : 'bg-emerald-950/50 border-emerald-400/50 text-emerald-200'
              }`}
            >
              {activeMissionTargetPOI ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onVisitPOI(activeMissionTargetPOI);
                  }}
                  className="w-full flex items-center justify-between gap-1 text-left cursor-pointer hover:text-white"
                  title="Klik untuk menuju Kios Konsultan Keuangan"
                >
                  <span className="truncate">🎯 Target: Kios Konsultan</span>
                  <span className="hidden sm:inline text-[8px] px-1 rounded bg-amber-400/25 text-amber-300 shrink-0">
                    Go
                  </span>
                </button>
              ) : (
                <span className="truncate">✓ Target Misi 1 Selesai</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE / TOUCH VIRTUAL JOYSTICK (Bottom-Left) & CIRCULAR INTERACT ACTION BUTTON (Bottom-Right)
          Automatically hidden on desktop devices via MobileTouchControls */}
      {(gameState === 'playing' || freeRoam) && !activeModalPOI && (
        <MobileTouchControls
          nearbyPOI={activePOI}
          onInteract={onOpenPOIModal}
        />
      )}

      {/* COLLAPSIBLE BOTTOM CONTROL & CAPITAL MARKET POI DOCK (Desktop Only) */}
      <div className="cuanture-desktop-dock hidden md:flex flex-col items-center mx-auto max-w-7xl w-full">
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.currentTarget.blur();
            setDockCollapsed((prev) => !prev);
          }}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-lg bg-[#0b1524]/90 border border-b-0 border-sky-400/30 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          {dockCollapsed ? '▴ Show Controls [H]' : '▾ Hide Controls [H]'}
        </button>

        {!dockCollapsed && (
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-[#0b1524]/92 border border-sky-400/35 shadow-2xl text-slate-200 w-fit max-w-full">
            {/* Live Kinematics Readout */}
            <div className="flex items-center gap-2.5 border-r border-slate-700/80 pr-2.5 shrink-0">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  SPEED
                </div>
                <div
                  data-testid="player-speed"
                  className="text-xs lg:text-sm font-bold font-mono tabular-nums text-white whitespace-nowrap"
                >
                  {Math.round(telemetry.speed)} m/s
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  POS (X, Z)
                </div>
                <div
                  data-testid="player-coords"
                  className="text-xs lg:text-sm font-bold font-mono tabular-nums text-sky-300 whitespace-nowrap"
                >
                  {Math.round(telemetry.x)}, {Math.round(telemetry.z)}
                </div>
              </div>
            </div>

            {/* 7 Capital Market POI Waypoints */}
            <div
              className="flex flex-wrap items-center justify-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/70"
              aria-label="Capital Market Points of Interest"
            >
              {CAPITAL_MARKET_POIS.map((poi) => {
                const isInside = activePOI?.id === poi.id;
                return (
                  <button
                    key={poi.id}
                    type="button"
                    tabIndex={-1}
                    data-testid={`dock-poi-${poi.id}`}
                    onClick={(e) => {
                      e.currentTarget.blur();
                      onVisitPOI(poi);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isInside
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {poi.name}
                  </button>
                );
              })}
            </div>

            {/* Camera Mode Segmented Control */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/70">
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  if (cameraMode !== 'follow') onToggleCameraMode();
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  cameraMode === 'follow'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                3rd-Person
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.currentTarget.blur();
                  if (cameraMode !== 'orbit') onToggleCameraMode();
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  cameraMode === 'orbit'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Orbit Cam
              </button>
            </div>

            {/* Time of Day Lighting Presets */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/70">
              {(['morning', 'noon', 'sunset'] as LightingPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onChangeLighting(preset);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    lightingPreset === preset
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          FINANCIAL ADVISOR KIOSK — RISK PROFILE MODAL (2D Image Assets)
      ===================================================================== */}
      {activeModalPOI && activeModalPOI.id === 'financial-advisor-kiosk' && (
        <RiskProfileModal onClose={onClosePOIModal} />
      )}

      {/* =====================================================================
          PERUSAHAAN SEKURITAS — STOCK TRADING TERMINAL MODAL (2D Image Assets)
      ===================================================================== */}
      {activeModalPOI && activeModalPOI.id === 'perusahaan-sekuritas' && (
        <TradingTerminal poi={activeModalPOI} onClose={onClosePOIModal} />
      )}

      {/* =====================================================================
          PUSAT REGULATOR — 'STRUKTUR PASAR MODAL INDONESIA' HIERARCHICAL FLOWCHART MODAL
      ===================================================================== */}
      {activeModalPOI && activeModalPOI.id === 'pusat-regulator' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="regulator-modal-title"
          data-testid="regulator-structure-modal"
          className="fixed inset-0 z-40 pointer-events-auto bg-slate-950/85 flex items-center justify-center p-2 sm:p-4"
        >
          <div className="bg-[#0b1524] border-2 border-red-400/65 rounded-2xl w-11/12 max-w-md md:max-w-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400">
                PUSAT REGULATOR · OJK &amp; SELF-REGULATORY ORGANIZATIONS
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-red-950/90 border border-red-400/50 text-[10px] font-bold text-red-200 shrink-0">
                OJK &amp; SRO
              </span>
            </div>

            <h2
              id="regulator-modal-title"
              data-testid="regulator-modal-title"
              className="text-xl sm:text-2xl md:text-3xl font-extrabold font-['Outfit'] text-white mb-4"
            >
              Struktur Pasar Modal Indonesia
            </h2>

            {/* HIERARCHICAL FLOWCHART CONTAINER */}
            <div className="flex flex-col items-center w-full mb-5">
              {/* TOP LEVEL: OJK (Otoritas Jasa Keuangan) */}
              <div
                data-testid="flowchart-top-ojk"
                className="w-full max-w-lg bg-slate-900/95 border-2 border-amber-400/75 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left"
              >
                <img
                  id={MARKET_REGULATOR_STRUCTURE.topLevel.logoId}
                  src={MARKET_REGULATOR_STRUCTURE.topLevel.logoUrl}
                  alt={MARKET_REGULATOR_STRUCTURE.topLevel.title}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      MARKET_REGULATOR_STRUCTURE.topLevel.fallbackSvgDataUri;
                  }}
                  className={`${MARKET_REGULATOR_STRUCTURE.topLevel.logoId} w-16 h-16 object-contain rounded-xl bg-white p-1.5 shadow-md shrink-0`}
                />
                <div>
                  <div className="inline-block px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                    TOP LEVEL · OTORITAS PENGAWAS
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white font-['Outfit']">
                    {MARKET_REGULATOR_STRUCTURE.topLevel.title}
                  </h3>
                  <p
                    data-testid="desc-ojk"
                    className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed"
                  >
                    {MARKET_REGULATOR_STRUCTURE.topLevel.description}
                  </p>
                </div>
              </div>

              {/* HIERARCHICAL FLOWCHART CONNECTOR LINES (OJK -> 3 SROs) */}
              <div className="flex flex-col items-center w-full my-1" aria-hidden="true">
                <div className="w-0.5 h-4 bg-amber-400/80" />
                <div className="px-3 py-0.5 rounded-full bg-slate-900 border border-sky-400/50 text-[10px] font-bold uppercase tracking-widest text-sky-300">
                  Self-Regulatory Organizations (SRO)
                </div>
                <div className="w-0.5 h-3 bg-sky-400/75" />
                <div className="hidden sm:grid sm:grid-cols-3 w-full px-12">
                  <div className="border-t-2 border-l-2 border-sky-400/60 h-3 rounded-tl-lg ml-auto w-1/2" />
                  <div className="border-t-2 border-sky-400/60 h-3 flex justify-center">
                    <div className="w-0.5 h-3 bg-sky-400/60" />
                  </div>
                  <div className="border-t-2 border-r-2 border-sky-400/60 h-3 rounded-tr-lg mr-auto w-1/2" />
                </div>
              </div>

              {/* BOTTOM LEVEL: 3 SRO ITEMS IN A ROW UNDERNEATH OJK (BEI, KPEI, KSEI) */}
              <div
                data-testid="flowchart-bottom-sros"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full"
              >
                {MARKET_REGULATOR_STRUCTURE.sroLevel.map((sro) => (
                  <div
                    key={sro.id}
                    data-testid={`sro-card-${sro.id}`}
                    className="bg-slate-900/95 border border-sky-400/45 hover:border-sky-400/80 rounded-xl p-3.5 flex flex-col items-center text-center shadow-lg transition-colors"
                  >
                    <img
                      id={sro.logoId}
                      src={sro.logoUrl}
                      alt={sro.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = sro.fallbackSvgDataUri;
                      }}
                      className={`${sro.logoId} w-16 h-16 object-contain rounded-xl bg-white p-1.5 shadow mb-2.5 shrink-0`}
                    />
                    <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/35 text-[9px] font-bold uppercase tracking-wider text-sky-300 mb-1">
                      SRO · {sro.shortCode}
                    </span>
                    <h4 className="text-sm font-extrabold text-white font-['Outfit'] leading-snug">
                      {sro.title}
                    </h4>
                    <p
                      data-testid={`desc-${sro.id}`}
                      className="text-xs text-slate-300 mt-1.5 leading-relaxed"
                    >
                      {sro.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer with Movement Paused Status & Close Button */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                Movement paused · Tap <strong className="text-slate-200">Close</strong> to resume
              </span>
              <button
                type="button"
                data-testid="close-poi-modal"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onClosePOIModal();
                }}
                className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shadow-lg shrink-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PUSAT REKSA DANA — 'MISI MENGENAL REKSA DANA' INTERACTIVE MODAL
      ===================================================================== */}
      {activeModalPOI && activeModalPOI.id === 'pusat-reksa-dana' && (
        <MutualFundMissionModal poi={activeModalPOI} onClose={onClosePOIModal} />
      )}

      {/* =====================================================================
          KPEI — 'MISI KLIRING & PENJAMINAN TRANSAKSI' INTERACTIVE MODAL
      ===================================================================== */}
      {activeModalPOI && activeModalPOI.id === 'kpei' && (
        <KpeiMissionModal poi={activeModalPOI} onClose={onClosePOIModal} />
      )}

      {/* =====================================================================
          EDUCATIONAL INTERACTION MODAL OVERLAY (Bursa Efek, KSEI & Indonesia SIPF)
      ===================================================================== */}
      {activeModalPOI &&
        activeModalPOI.id !== 'perusahaan-sekuritas' &&
        activeModalPOI.id !== 'financial-advisor-kiosk' &&
        activeModalPOI.id !== 'pusat-regulator' &&
        activeModalPOI.id !== 'pusat-reksa-dana' &&
        activeModalPOI.id !== 'kpei' && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="poi-modal-title"
            data-testid="poi-educational-modal"
            className="fixed inset-0 z-40 pointer-events-auto bg-slate-950/80 flex items-center justify-center p-3 sm:p-4"
          >
            <div
              className={`bg-[#0b1524] border-2 rounded-2xl w-11/12 p-4 sm:p-6 max-h-[88vh] overflow-y-auto shadow-2xl text-slate-100 ${
                activeModalPOI.id === 'ksei'
                  ? 'border-violet-400/70 max-w-lg'
                  : activeModalPOI.id === 'indonesia-sipf'
                    ? 'border-yellow-400/75 max-w-lg'
                    : 'border-amber-400/70 max-w-md'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400">
                  CAPITAL MARKET EDUCATION · {activeModalPOI.englishName.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300 shrink-0">
                  {activeModalPOI.shortLabel}
                </span>
              </div>

              <h2
                id="poi-modal-title"
                className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-white mb-3"
              >
                {activeModalPOI.name}
              </h2>

              <div className="bg-slate-900/95 border border-sky-400/40 rounded-xl p-4 mb-4 shadow-inner">
                {activeModalPOI.id === 'ksei' && (
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300 mb-1">
                    Apa itu KSEI?
                  </div>
                )}
                {activeModalPOI.id === 'indonesia-sipf' && (
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-300 mb-1">
                    Apa itu Indonesia SIPF?
                  </div>
                )}
                <p
                  data-testid="poi-educational-text"
                  className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed"
                >
                  {activeModalPOI.educationalText}
                </p>
              </div>

              {activeModalPOI.id === 'ksei' && (
                <div data-testid="ksei-educational-details" className="space-y-3 mb-4">
                  <div className="bg-slate-900/90 border border-violet-400/35 rounded-xl p-3.5">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-300 mb-2">
                      Apa yang dilakukan KSEI?
                    </h3>
                    <ul
                      data-testid="ksei-functions-list"
                      className="space-y-2 text-xs text-slate-200 leading-relaxed"
                    >
                      <li className="flex items-start gap-2">
                        <span className="text-violet-400 font-extrabold shrink-0">1.</span>
                        <span>
                          <strong className="text-white">Pencatatan &amp; Penyimpanan Efek Elektronik:</strong> Efek (seperti saham dan obligasi) dicatat serta disimpan secara elektronik (tanpa warkat) di dalam sistem kustodian sentral.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-violet-400 font-extrabold shrink-0">2.</span>
                        <span>
                          <strong className="text-white">Penyelesaian Transaksi Efek:</strong> KSEI berperan dalam penyelesaian transaksi efek (pemindahbukuan) sesuai mekanisme dan ketentuan yang berlaku.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-violet-400 font-extrabold shrink-0">3.</span>
                        <span>
                          <strong className="text-white">SID (Single Investor Identification):</strong> Menerbitkan nomor identitas tunggal bagi setiap investor di pasar modal Indonesia.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-violet-400 font-extrabold shrink-0">4.</span>
                        <span>
                          <strong className="text-white">RDN (Rekening Dana Nasabah):</strong> RDN adalah rekening dana atas nama investor untuk penyelesaian uang transaksi, yang berbeda dari pencatatan kepemilikan efek di KSEI.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-violet-400 font-extrabold shrink-0">5.</span>
                        <span>
                          <strong className="text-white">Fasilitas AKSes KSEI:</strong> Membantu investor memantau informasi saldo dan mutasi kepemilikan efeknya secara mandiri sesuai fasilitas yang tersedia.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div
                    data-testid="ksei-role-distinction"
                    className="bg-violet-950/40 border border-violet-400/40 rounded-xl p-3 text-xs text-slate-200 leading-relaxed"
                  >
                    <strong className="text-amber-300">Catatan Penting: </strong>
                    KSEI menjalankan fungsi <strong>kustodian sentral dan administrasi penyimpanan efek</strong> (berbeda dari <strong>KPEI</strong> yang menjalankan fungsi kliring serta penjaminan penyelesaian transaksi bursa). KSEI tidak menjamin keuntungan investasi atas fluktuasi harga pasar.
                  </div>
                </div>
              )}

              {activeModalPOI.id === 'indonesia-sipf' && (
                <div data-testid="sipf-educational-details" className="space-y-3 mb-4">
                  <div className="bg-slate-900/90 border border-yellow-400/35 rounded-xl p-3.5">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-yellow-300 mb-2">
                      Fungsi Dana Perlindungan Pemodal (DPP)
                    </h3>
                    <ul
                      data-testid="sipf-functions-list"
                      className="space-y-2 text-xs text-slate-200 leading-relaxed"
                    >
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-extrabold shrink-0">1.</span>
                        <span>
                          <strong className="text-white">Penyelenggara Dana Perlindungan Pemodal:</strong> Indonesia SIPF mengelola kumpulan dana yang dibentuk untuk melindungi pemodal (investor) di pasar modal Indonesia.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-extrabold shrink-0">2.</span>
                        <span>
                          <strong className="text-white">Perlindungan Aset yang Dititipkan pada Kustodian:</strong> Memberikan ganti rugi atas <strong>aset pemodal yang hilang</strong> saat dititipkan pada Kustodian (Perusahaan Sekuritas atau Bank Kustodian anggota DPP) sesuai syarat dan ketentuan peraturan OJK.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400 font-extrabold shrink-0">3.</span>
                        <span>
                          <strong className="text-white">Meningkatkan Kepercayaan Investor:</strong> Menjadi jaring pengaman (*safety net*) agar masyarakat merasa aman menitipkan efek dan dananya di infrastruktur pasar modal resmi.
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div
                    data-testid="sipf-market-risk-distinction"
                    className="bg-amber-950/45 border border-yellow-400/45 rounded-xl p-3 text-xs text-slate-200 leading-relaxed"
                  >
                    <strong className="text-yellow-300">Perlindungan Aset vs Risiko Pasar: </strong>
                    Indonesia SIPF <strong>tidak menjamin keuntungan investasi</strong> dan <strong>tidak mengganti kerugian akibat turunnya harga saham/efek karena fluktuasi pasar</strong>. Risiko naik-turun harga pasar tetap menjadi tanggung jawab investor, sedangkan SIPF melindungi aset pemodal yang tercatat pada kustodian dari kehilangan sesuai ketentuan yang berlaku.
                  </div>

                  <div
                    data-testid="sipf-ecosystem-comparison"
                    className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3 text-[11px] sm:text-xs text-slate-300 leading-relaxed"
                  >
                    <div className="font-extrabold uppercase tracking-wider text-sky-300 mb-1.5">
                      Perbandingan Peran Lembaga Pasar Modal
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div><strong className="text-white">OJK:</strong> Mengatur &amp; mengawasi sektor jasa keuangan.</div>
                      <div><strong className="text-white">BEI:</strong> Memfasilitasi perdagangan efek di bursa.</div>
                      <div><strong className="text-white">KPEI:</strong> Kliring &amp; penjaminan penyelesaian transaksi.</div>
                      <div><strong className="text-white">KSEI:</strong> Kustodian sentral &amp; penyimpanan efek elektronik.</div>
                      <div className="sm:col-span-2 text-yellow-200">
                        <strong className="text-yellow-300">Indonesia SIPF:</strong> Mengelola Dana Perlindungan Pemodal atas aset investor di kustodian.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeModalPOI.id === 'bursa-efek' && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {stocks.map((st) => {
                    const isUp = st.changePercent >= 0;
                    return (
                      <div
                        key={st.ticker}
                        className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 text-center"
                      >
                        <div className="text-xs font-extrabold text-sky-300">{st.ticker}</div>
                        <div className="text-xs sm:text-sm font-bold font-mono tabular-nums text-white mt-0.5">
                          {formatIDR(st.currentPrice)}
                        </div>
                        <div
                          className={`text-[10px] font-bold font-mono tabular-nums mt-0.5 ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {st.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-start gap-2.5 bg-slate-900/60 border border-slate-800 rounded-xl p-3 mb-5 text-xs text-slate-300 leading-relaxed">
                <div
                  className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: activeModalPOI.themeColor }}
                />
                <div>
                  <span className="font-bold text-slate-200">{activeModalPOI.englishName}: </span>
                  {activeModalPOI.summary}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                  Movement paused · Tap <strong className="text-slate-200">Close</strong> to resume
                </span>
                <button
                  type="button"
                  data-testid="close-poi-modal"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    onClosePOIModal();
                  }}
                  className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shadow-lg shrink-0"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* PAUSE & SETTINGS MODAL */}
      {gameState === 'paused' && !activeModalPOI && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pause-modal-title"
          data-testid="pause-settings-modal"
          className="fixed inset-0 z-30 pointer-events-auto bg-slate-950/75 flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-[#0b1524] border border-sky-400/40 rounded-2xl w-11/12 max-w-md p-4 sm:p-5 max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sky-400">
                EXPEDITION PAUSED · PENGATURAN
              </span>
              {onResetSettings && (
                <button
                  type="button"
                  data-testid="reset-settings-btn"
                  onClick={onResetSettings}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Reset Default
                </button>
              )}
            </div>
            <h2 id="pause-modal-title" className="text-xl sm:text-2xl font-extrabold font-['Outfit'] mb-3">
              Aether Isle & Settings
            </h2>

            <div className="grid grid-cols-3 gap-2 mb-3.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-400">SHARDS</div>
                <div className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-sky-400">
                  {Math.round(collectedCount)} / {Math.round(totalShards)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-400">ELAPSED</div>
                <div className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-white">
                  {formatDuration(elapsedSeconds)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-400">EQUITY</div>
                <div className="text-xs sm:text-sm font-extrabold font-mono tabular-nums text-emerald-400">
                  {formatIDR(totalEquity)}
                </div>
              </div>
            </div>

            {/* SETTINGS PANEL: Camera Sensitivity, Zoom Speed, Audio, Graphics Quality */}
            <div
              data-testid="settings-panel"
              className="flex flex-col gap-3 mb-4 bg-slate-900/95 border border-slate-800 rounded-xl p-3.5"
            >
              {/* 1. Camera Rotation Sensitivity */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="setting-camera-sensitivity" className="font-bold text-slate-200">
                    Sensitivitas Kamera
                  </label>
                  <span
                    data-testid="setting-camera-sensitivity-value"
                    className="font-mono font-bold text-sky-300"
                  >
                    {settings.cameraSensitivity.toFixed(2)}x
                  </span>
                </div>
                <input
                  id="setting-camera-sensitivity"
                  data-testid="setting-camera-sensitivity"
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.25}
                  value={settings.cameraSensitivity}
                  onChange={(e) =>
                    onUpdateSettings?.({ cameraSensitivity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* 2. Camera Zoom Speed */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="setting-zoom-speed" className="font-bold text-slate-200">
                    Kecepatan Zoom Kamera
                  </label>
                  <span
                    data-testid="setting-zoom-speed-value"
                    className="font-mono font-bold text-sky-300"
                  >
                    {settings.zoomSpeed.toFixed(2)}x
                  </span>
                </div>
                <input
                  id="setting-zoom-speed"
                  data-testid="setting-zoom-speed"
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.25}
                  value={settings.zoomSpeed}
                  onChange={(e) =>
                    onUpdateSettings?.({ zoomSpeed: parseFloat(e.target.value) })
                  }
                  className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* 3. Audio Volume & Mute Toggle */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label htmlFor="setting-audio-volume" className="font-bold text-slate-200">
                    Audio & Efek Suara
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      data-testid="setting-audio-volume-value"
                      className="font-mono font-bold text-emerald-300"
                    >
                      {isMuted ? 'Muted' : `${Math.round(settings.audioVolume * 100)}%`}
                    </span>
                    <button
                      type="button"
                      data-testid="setting-audio-mute-btn"
                      onClick={onToggleMute}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        isMuted
                          ? 'bg-rose-500/25 border border-rose-400/50 text-rose-300'
                          : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                      }`}
                    >
                      {isMuted ? 'Suara Mati' : 'Suara Aktif'}
                    </button>
                  </div>
                </div>
                <input
                  id="setting-audio-volume"
                  data-testid="setting-audio-volume"
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={settings.audioVolume}
                  onChange={(e) =>
                    onUpdateSettings?.({ audioVolume: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* 4. Graphics Quality Preset */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-slate-200">Kualitas Grafis</span>
                  <span
                    data-testid="setting-graphics-quality-value"
                    className="text-[11px] font-bold uppercase text-amber-300"
                  >
                    {settings.graphicsQuality === 'low'
                      ? 'Rendah (Hemat)'
                      : settings.graphicsQuality === 'medium'
                        ? 'Sedang'
                        : 'Tinggi (Ultra)'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'low', label: 'Rendah' },
                      { id: 'medium', label: 'Sedang' },
                      { id: 'high', label: 'Tinggi' },
                    ] as Array<{ id: GraphicsQuality; label: string }>
                  ).map((opt) => {
                    const active = settings.graphicsQuality === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        data-testid={`setting-graphics-${opt.id}`}
                        onClick={() => onUpdateSettings?.({ graphicsQuality: opt.id })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          active
                            ? 'bg-amber-500 border-amber-300 text-slate-950 shadow'
                            : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-testid="resume-exploration-btn"
                onClick={onResumeGame}
                className="w-full py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
              >
                Resume Exploration
              </button>
              <button
                type="button"
                onClick={onResetPlayer}
                className="w-full py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
              >
                Respawn at Arrival Plaza
              </button>
              <button
                type="button"
                onClick={onRestartRun}
                className="w-full py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
              >
                Restart Expedition
              </button>
              <button
                type="button"
                onClick={onReturnTitle}
                className="w-full py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
              >
                Return to Title Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY / SANCTUARY AWAKENED MODAL */}
      {gameState === 'gameover' && !freeRoam && !activeModalPOI && victorySnapshot && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="victory-modal-title"
          className="fixed inset-0 z-30 pointer-events-auto bg-slate-950/75 flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-[#0b1524] border border-amber-400/50 rounded-2xl w-11/12 max-w-md p-4 sm:p-6 shadow-2xl text-slate-100">
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">
              SANCTUARY AWAKENED
            </div>
            <h2 id="victory-modal-title" className="text-xl sm:text-2xl font-extrabold font-['Outfit'] mb-2">
              All Aether Shards Harmonized!
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              The Sunstone Monolith and Capital Market Sanctuary resonate at full power across Aether Isle.
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-400">CLEAR TIME</div>
                <div className="text-base sm:text-lg font-extrabold font-mono tabular-nums text-amber-400">
                  {formatDuration(victorySnapshot.clearTime)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-400">SHARDS</div>
                <div className="text-base sm:text-lg font-extrabold font-mono tabular-nums text-sky-400">
                  {Math.round(totalShards)} / {Math.round(totalShards)}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase text-slate-400">EQUITY</div>
                <div className="text-xs sm:text-sm font-extrabold font-mono tabular-nums text-emerald-400">
                  {formatIDR(totalEquity)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-start="true"
                onClick={onRestartRun}
                className="w-full py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={onEnterFreeRoam}
                className="w-full py-2.5 px-5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-semibold text-sm transition-colors cursor-pointer"
              >
                Continue Free Roam on Island
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          RESET GAME ('MULAI ULANG') CONFIRMATION MODAL
          Clears 'capital_market_save_data' from localStorage and resets state
      ===================================================================== */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-modal-title"
          data-testid="reset-game-confirm-modal"
          className="fixed inset-0 z-50 pointer-events-auto bg-slate-950/85 flex items-center justify-center p-3 sm:p-4"
        >
          <div className="bg-[#0b1524] border-2 border-rose-400/75 rounded-2xl w-11/12 max-w-md p-5 sm:p-6 shadow-2xl text-slate-100">
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-rose-400 mb-1">
              KONFIRMASI RESET PERMAINAN
            </div>
            <h2
              id="reset-confirm-modal-title"
              className="text-lg sm:text-xl font-extrabold font-['Outfit'] text-white mb-2"
            >
              Mulai Ulang Permainan (Reset Game)?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
              Seluruh data progres investasi (<strong className="text-white">Saldo Kas</strong>,{' '}
              <strong className="text-white">Portofolio Saham</strong>, dan{' '}
              <strong className="text-white">Profil Risiko</strong>) yang tersimpan di penyimpanan lokal (
              <code className="text-amber-300 font-mono text-[11px]">capital_market_save_data</code>) akan dihapus dan dikembalikan ke modal awal <strong className="text-emerald-300">Rp 10.000.000</strong>.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                data-testid="cancel-reset-game-btn"
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                data-testid="confirm-reset-game-btn"
                onClick={() => {
                  clearSaveAndResetMarket();
                  onRestartRun();
                  setShowResetConfirm(false);
                }}
                className="py-2.5 px-5 rounded-xl bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shadow-lg"
              >
                Ya, Mulai Ulang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

