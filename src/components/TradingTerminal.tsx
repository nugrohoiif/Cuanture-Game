import { useState } from 'react';
import {
  formatIDR,
  SHARES_PER_LOT,
  type StockItem,
} from '../game/market';
import type { CapitalMarketPOI } from '../game/physics';
import { useMarket } from '../game/MarketContext';

interface TradingTerminalProps {
  poi: CapitalMarketPOI;
  onClose: () => void;
}

function StockSparkline({ stock }: { stock: StockItem }) {
  const pts = stock.priceHistory;
  if (pts.length < 2) return null;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = Math.max(1, max - min);
  const width = 76;
  const height = 24;

  const polylinePoints = pts
    .map((val, idx) => {
      const x = (idx / (pts.length - 1)) * (width - 6) + 3;
      const y = height - 4 - ((val - min) / span) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const isUp = stock.changePercent >= 0;
  const strokeColor = isUp ? '#4ade80' : '#f87171';

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-16 sm:w-20 h-6 shrink-0 bg-slate-950/80 rounded border border-slate-800"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />
    </svg>
  );
}

export function TradingTerminal({ poi, onClose }: TradingTerminalProps) {
  const [showMacroTooltip, setShowMacroTooltip] = useState(false);

  const {
    balance,
    portfolio,
    stocks,
    toast,
    activeNews,
    diversificationStatus,
    totalPortfolioValue,
    totalEquity,
    buyOneLot,
    sellOneLot,
    triggerNewsEvent,
    clearToast,
  } = useMarket();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trading-terminal-title"
      data-testid="trading-terminal-modal"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 pointer-events-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div className="w-11/12 max-w-md md:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#0b1628] via-[#0d1c33] to-[#081221] border-2 border-sky-400/50 p-4 sm:p-6 shadow-2xl text-slate-100">
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-sky-400">
                PERUSAHAAN SEKURITAS · BROKER TERMINAL
              </span>
            </div>
            <h2
              id="trading-terminal-title"
              className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-white mt-0.5"
            >
              Stock Trading Terminal
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Button for triggering Macroeconomic Indicator News */}
            <button
              type="button"
              data-testid="trigger-news-btn"
              onClick={() => triggerNewsEvent()}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/25 to-orange-500/25 hover:from-amber-500/40 hover:to-orange-500/40 border border-amber-400/60 text-[10px] sm:text-[11px] font-extrabold text-amber-200 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            >
              ⚡ Breaking News
            </button>

            {/* Diversification Status Badge */}
            <div
              data-testid="diversification-status-badge"
              className={`px-2.5 py-1 rounded-lg border text-[10px] sm:text-[11px] font-extrabold whitespace-nowrap ${
                diversificationStatus.isConcentrated
                  ? 'bg-rose-950/90 border-rose-400/75 text-rose-200'
                  : diversificationStatus.maxAllocationPercent > 0
                  ? 'bg-emerald-950/90 border-emerald-400/75 text-emerald-200'
                  : 'bg-slate-900/90 border-slate-700 text-slate-300'
              }`}
            >
              Diversifikasi: {diversificationStatus.statusLabel}
            </div>
          </div>
        </div>

        <p
          data-testid="poi-educational-text"
          className="text-xs text-slate-200 mb-3 bg-slate-950/75 border border-slate-800 px-3 py-2 rounded-xl leading-relaxed"
        >
          {poi.educationalText}
        </p>

        {/* Active Macroeconomic Indicator Strip + Interactive Info Tooltip inside Terminal */}
        {activeNews && (
          <div
            data-testid="terminal-macro-news-bar"
            className="relative mb-3 px-3 py-2 rounded-xl bg-slate-900/95 border border-amber-400/65 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider shrink-0">
                  MAKROEKONOMI
                </span>
                <span className="font-bold text-amber-200 truncate">
                  {activeNews.event.indicatorTitle}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono font-extrabold text-[10px] shrink-0 ${
                    activeNews.event.impact.effect >= 1
                      ? 'bg-emerald-500/25 text-emerald-300'
                      : 'bg-rose-500/25 text-rose-300'
                  }`}
                >
                  {activeNews.event.impact.ticker}{' '}
                  {activeNews.event.impact.effect >= 1 ? '+' : ''}
                  {Math.round((activeNews.event.impact.effect - 1) * 100)}%
                </span>
              </div>

              {/* Info Tooltip Trigger next to Macroeconomic News Event */}
              <div
                className="relative shrink-0"
                onMouseEnter={() => setShowMacroTooltip(true)}
                onMouseLeave={() => setShowMacroTooltip(false)}
              >
                <button
                  type="button"
                  data-testid="terminal-news-tooltip-btn"
                  aria-label="Info Indikator Makroekonomi"
                  onClick={() => setShowMacroTooltip((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/25 hover:bg-sky-500/40 border border-sky-400/60 text-sky-200 text-[10px] font-extrabold cursor-pointer transition-colors"
                >
                  <span>ⓘ</span>
                  <span>Info</span>
                </button>

                {showMacroTooltip && (
                  <div
                    role="tooltip"
                    data-testid="terminal-news-tooltip-box"
                    className="absolute right-0 top-full mt-1.5 z-50 w-64 sm:w-80 p-3 rounded-xl bg-[#07111e] border-2 border-sky-400/80 shadow-2xl text-[11px] text-slate-100 leading-relaxed"
                  >
                    <div className="font-extrabold text-amber-300 mb-1">
                      {activeNews.event.indicatorTitle}
                    </div>
                    <p>{activeNews.event.tooltipExplanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Balance & Portfolio Summary Panel */}
        <div className="w-full mb-3 rounded-xl bg-gradient-to-r from-slate-900/95 via-[#0f2238]/95 to-slate-900/95 border border-sky-400/35 px-3.5 py-3 sm:px-4 shadow-lg">
          <div className="grid grid-cols-2 sm:grid-cols-3 items-center gap-2 sm:gap-3">
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-300 leading-none">
                CURRENT BALANCE (CASH)
              </div>
              <div
                data-testid="terminal-balance"
                className="text-base sm:text-xl font-extrabold font-mono tabular-nums text-white mt-1 leading-tight"
              >
                {formatIDR(balance)}
              </div>
            </div>

            <div>
              <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-300 leading-none">
                PORTFOLIO VALUE
              </div>
              <div
                data-testid="terminal-portfolio-value"
                className="text-xs sm:text-lg font-extrabold font-mono tabular-nums text-sky-200 mt-1 leading-tight"
              >
                {formatIDR(totalPortfolioValue)}
              </div>
            </div>

            <div>
              <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-300 leading-none">
                TOTAL EQUITY
              </div>
              <div
                data-testid="terminal-total-equity"
                className="text-xs sm:text-lg font-extrabold font-mono tabular-nums text-amber-200 mt-1 leading-tight"
              >
                {formatIDR(totalEquity)}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            PORTFOLIO DIVERSIFICATION VISUAL WARNING BANNER (> 80% IN SINGLE STOCK)
            Exact required warning text:
            'Peringatan: Portofolio berisiko tinggi karena tidak terdiversifikasi'
        ================================================================= */}
        {diversificationStatus.isConcentrated && diversificationStatus.warningMessage && (
          <div
            role="alert"
            data-testid="diversification-warning-banner"
            className="mb-3 px-3.5 py-2.5 rounded-xl bg-amber-950/95 border-2 border-amber-400 text-amber-100 shadow-lg flex items-start gap-2.5"
          >
            <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider shrink-0 mt-0.5">
              RISIKO KONSENTRASI &gt;80%
            </span>
            <div className="text-xs leading-snug">
              <p
                data-testid="diversification-warning-text"
                className="font-extrabold text-amber-200"
              >
                {diversificationStatus.warningMessage}
              </p>
              <p className="text-[11px] text-amber-100/90 mt-0.5">
                Alokasi saham{' '}
                <strong className="font-mono font-bold text-white">
                  {diversificationStatus.concentratedTicker}
                </strong>{' '}
                mencapai{' '}
                <strong className="font-mono font-bold text-white">
                  {diversificationStatus.maxAllocationPercent}%
                </strong>{' '}
                dari total nilai asetmu (&gt;80%). Sebar investasi ke beberapa saham atau simpan kas agar risiko terkendali.
              </p>
            </div>
          </div>
        )}

        {/* Transaction Toast / Alert Banner */}
        {toast && (
          <div
            role="status"
            aria-live="polite"
            data-testid="trade-toast"
            data-toast-type={toast.type}
            className={`mb-3 px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-400/70 text-emerald-200'
                : 'bg-rose-950/95 border-rose-400/70 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                  toast.type === 'success'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-rose-400 text-slate-950'
                }`}
              >
                {toast.type === 'success' ? 'FILLED' : 'REJECTED'}
              </span>
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={clearToast}
              className="text-[11px] opacity-80 hover:opacity-100 underline cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3 Live Stocks List */}
        <div className="space-y-2.5 mb-4">
          {stocks.map((stock) => {
            const ownedShares = portfolio[stock.ticker] ?? 0;
            const ownedLots = Math.floor(ownedShares / SHARES_PER_LOT);
            const lotCost = stock.currentPrice * SHARES_PER_LOT;
            const isUp = stock.changePercent >= 0;
            const allocationPct =
              diversificationStatus.allocationsByTicker[stock.ticker] ?? 0;

            return (
              <div
                key={stock.ticker}
                data-testid={`stock-row-${stock.ticker}`}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-sky-400/45 p-3 sm:p-3.5 shadow-md transition-colors flex flex-col gap-2.5"
              >
                {/* Top Row: Ticker, Live Price & Shares Owned */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/20 border border-sky-400/50 flex flex-col items-center justify-center shrink-0">
                      <span className="font-extrabold font-mono text-xs text-sky-300">
                        {stock.ticker}
                      </span>
                      <span className="text-[8px] text-slate-300 font-semibold">IDX</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-sm sm:text-base text-white">
                          {stock.ticker}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tabular-nums ${
                            isUp
                              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/25 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800/90 text-[9px] font-mono text-slate-300">
                          Bobot: {allocationPct}%
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate max-w-[135px] sm:max-w-none">
                        {stock.companyName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <div className="hidden sm:block">
                      <StockSparkline stock={stock} />
                    </div>

                    <div className="text-right">
                      <div
                        data-testid={`stock-price-${stock.ticker}`}
                        className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-white leading-tight"
                      >
                        {formatIDR(stock.currentPrice)}
                      </div>
                      <div className="text-[9px] sm:text-[10px] font-mono tabular-nums text-amber-300">
                        1 Lot: {formatIDR(lotCost)}
                      </div>
                    </div>

                    <div className="text-right bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-700/80 min-w-[68px] sm:min-w-[76px]">
                      <div className="text-[8px] sm:text-[9px] font-bold uppercase text-slate-400 leading-none">
                        OWNED
                      </div>
                      <div
                        data-testid={`stock-owned-${stock.ticker}`}
                        className="text-xs sm:text-sm font-extrabold font-mono tabular-nums text-sky-300 leading-tight mt-0.5"
                      >
                        {ownedShares} sh
                      </div>
                      <div className="text-[8px] sm:text-[9px] font-mono tabular-nums text-slate-400 leading-none">
                        ({ownedLots} Lot)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Row: 'Buy 1 Lot (100 shares)' & 'Sell 1 Lot' */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    data-testid={`buy-btn-${stock.ticker}`}
                    onClick={() => buyOneLot(stock.ticker)}
                    className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] font-extrabold text-[11px] sm:text-xs text-slate-950 tracking-wide shadow-md transition-all cursor-pointer"
                  >
                    Buy 1 Lot (100 shares)
                  </button>

                  <button
                    type="button"
                    data-testid={`sell-btn-${stock.ticker}`}
                    onClick={() => sellOneLot(stock.ticker)}
                    className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 active:scale-[0.99] font-extrabold text-[11px] sm:text-xs text-slate-950 tracking-wide shadow-md transition-all cursor-pointer"
                  >
                    Sell 1 Lot
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Movement Paused Status & Close Button */}
        <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-800/90">
          <span className="text-[11px] sm:text-xs text-slate-300 font-medium">
            Movement paused · Tap <strong className="text-white">Close</strong> to resume
          </span>
          <button
            type="button"
            data-testid="close-poi-modal"
            onClick={(e) => {
              e.currentTarget.blur();
              onClose();
            }}
            className="px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] font-extrabold text-xs sm:text-sm text-slate-950 tracking-wide shadow-lg transition-all cursor-pointer shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
