/**
 * 2D Custom Asset Registry for TradingTerminal and RiskProfileModal.
 * Uses placehold.co placeholder PNG URLs by default so custom PNG designs
 * can be swapped in directly via URL or targeted via their CSS classes/IDs:
 * - .panel-bg-asset (#trading-panel-bg-asset, #risk-panel-bg-asset)
 * - .balance-panel-bg-asset (#balance-panel-bg-asset)
 * - .stock-card-bg-asset (#stock-card-bg-BBCA, etc.)
 * - .btn-buy-asset (#btn-buy-asset-BBCA, etc.)
 * - .btn-sell-asset (#btn-sell-asset-BBCA, etc.)
 * - .btn-close-asset (#btn-close-trading-asset, #btn-close-risk-asset)
 * - .question-panel-bg-asset (#question-panel-bg-asset)
 * - .btn-quiz-option-asset (#btn-quiz-option-A, #btn-quiz-option-B, #btn-quiz-option-C)
 */

function createFramedSvgDataUri(
  width: number,
  height: number,
  fillHex: string,
  strokeHex: string,
  rx = 20
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><rect x="3" y="3" width="${
    width - 6
  }" height="${
    height - 6
  }" rx="${rx}" fill="${fillHex}" stroke="${strokeHex}" stroke-width="4"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const UI_2D_ASSETS = {
  tradingModalBg: {
    className: 'panel-bg-asset',
    id: 'trading-panel-bg-asset',
    src: 'https://placehold.co/920x1080/0b1524/38bdf8.png?text=+',
    fallbackSrc: createFramedSvgDataUri(920, 1080, '#0b1524', '#38bdf8', 24),
  },
  balanceBannerBg: {
    className: 'balance-panel-bg-asset',
    id: 'balance-panel-bg-asset',
    src: 'https://placehold.co/840x160/0f1f36/34d399.png?text=+',
    fallbackSrc: createFramedSvgDataUri(840, 160, '#0f1f36', '#34d399', 16),
  },
  stockCardBg: {
    className: 'stock-card-bg-asset',
    src: 'https://placehold.co/840x210/0f172a/38bdf8.png?text=+',
    fallbackSrc: createFramedSvgDataUri(840, 210, '#0f172a', '#38bdf8', 16),
  },
  buyButton: {
    className: 'btn-buy-asset',
    src: 'https://placehold.co/380x84/10b981/022c22.png?text=+',
    fallbackSrc: createFramedSvgDataUri(380, 84, '#10b981', '#6ee7b7', 14),
  },
  sellButton: {
    className: 'btn-sell-asset',
    src: 'https://placehold.co/380x84/f43f5e/4c0519.png?text=+',
    fallbackSrc: createFramedSvgDataUri(380, 84, '#f43f5e', '#fda4af', 14),
  },
  closeButton: {
    className: 'btn-close-asset',
    src: 'https://placehold.co/260x80/f59e0b/451a03.png?text=+',
    fallbackSrc: createFramedSvgDataUri(260, 80, '#f59e0b', '#fde68a', 14),
  },
  newsTriggerButton: {
    className: 'btn-news-asset',
    src: 'https://placehold.co/260x72/78350f/fbbf24.png?text=+',
    fallbackSrc: createFramedSvgDataUri(260, 72, '#78350f', '#fbbf24', 12),
  },
  riskModalBg: {
    className: 'panel-bg-asset',
    id: 'risk-panel-bg-asset',
    src: 'https://placehold.co/680x860/0b1524/f59e0b.png?text=+',
    fallbackSrc: createFramedSvgDataUri(680, 860, '#0b1524', '#f59e0b', 24),
  },
  questionCardBg: {
    className: 'question-panel-bg-asset',
    id: 'question-panel-bg-asset',
    src: 'https://placehold.co/600x180/0f1f36/38bdf8.png?text=+',
    fallbackSrc: createFramedSvgDataUri(600, 180, '#0f1f36', '#38bdf8', 16),
  },
  quizOptionButton: {
    className: 'btn-quiz-option-asset',
    src: 'https://placehold.co/600x110/111c2d/f59e0b.png?text=+',
    fallbackSrc: createFramedSvgDataUri(600, 110, '#111c2d', '#f59e0b', 14),
  },
} as const;
