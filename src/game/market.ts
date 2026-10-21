export type StockTicker = 'BBCA' | 'TLKM' | 'GOTO';

export interface StockItem {
  ticker: StockTicker;
  companyName: string;
  sector: string;
  basePrice: number;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  priceHistory: number[];
}

export type PortfolioMap = Record<StockTicker, number>;

export interface TradeToast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export interface MacroNewsImpact {
  ticker: StockTicker;
  effect: number; // Multiplier, e.g., 1.15 for +15%, 0.85 for -15%
}

export interface MacroNewsEvent {
  id: string;
  indicatorTitle: string;
  headline: string;
  category: string;
  tooltipExplanation: string;
  impact: MacroNewsImpact;
}

export interface ActiveMacroNewsState {
  event: MacroNewsEvent;
  remainingTicks: number; // Number of 3s price updates remaining (2-3 ticks)
  totalTicks: number;
  triggeredAt: number;
}

export const DIVERSIFICATION_WARNING_TEXT =
  'Peringatan: Portofolio berisiko tinggi karena tidak terdiversifikasi';

export interface DiversificationStatus {
  isConcentrated: boolean;
  statusLabel:
    | 'Tidak Terdiversifikasi (Risiko Tinggi)'
    | 'Terdiversifikasi Sehat'
    | 'Belum Berinvestasi (100% Kas)';
  concentratedTicker: StockTicker | null;
  maxAllocationRatio: number; // 0.0 to 1.0
  maxAllocationPercent: number; // 0 to 100
  allocationsByTicker: Record<StockTicker, number>; // percentage 0..100 of total asset value
  warningMessage: string | null;
}

/**
 * Evaluates portfolio diversification using standard financial management principles.
 * If the player allocates more than 80% (> 0.80) of their total asset value (balance + stock value)
 * into a single stock ticker, triggers the high-risk concentration warning:
 * 'Peringatan: Portofolio berisiko tinggi karena tidak terdiversifikasi'
 */
export function evaluatePortfolioDiversification(
  balance: number,
  portfolio: PortfolioMap,
  stocks: StockItem[]
): DiversificationStatus {
  const stockValues: Record<StockTicker, number> = {
    BBCA: 0,
    TLKM: 0,
    GOTO: 0,
  };

  let totalStockValue = 0;
  for (const stock of stocks) {
    const shares = portfolio[stock.ticker] ?? 0;
    const val = shares * stock.currentPrice;
    stockValues[stock.ticker] = val;
    totalStockValue += val;
  }

  const totalAssetValue = balance + totalStockValue;

  const allocationsByTicker: Record<StockTicker, number> = {
    BBCA:
      totalAssetValue > 0
        ? Number(((stockValues.BBCA / totalAssetValue) * 100).toFixed(1))
        : 0,
    TLKM:
      totalAssetValue > 0
        ? Number(((stockValues.TLKM / totalAssetValue) * 100).toFixed(1))
        : 0,
    GOTO:
      totalAssetValue > 0
        ? Number(((stockValues.GOTO / totalAssetValue) * 100).toFixed(1))
        : 0,
  };

  let maxTicker: StockTicker | null = null;
  let maxRatio = 0;

  for (const ticker of ['BBCA', 'TLKM', 'GOTO'] as StockTicker[]) {
    const ratio = totalAssetValue > 0 ? stockValues[ticker] / totalAssetValue : 0;
    if (ratio > maxRatio) {
      maxRatio = ratio;
      maxTicker = ticker;
    }
  }

  const maxAllocationPercent = Number((maxRatio * 100).toFixed(1));

  // Strictly > 80% of total asset value (balance + stock value) in a single stock ticker
  if (maxRatio > 0.8) {
    return {
      isConcentrated: true,
      statusLabel: 'Tidak Terdiversifikasi (Risiko Tinggi)',
      concentratedTicker: maxTicker,
      maxAllocationRatio: maxRatio,
      maxAllocationPercent,
      allocationsByTicker,
      warningMessage: DIVERSIFICATION_WARNING_TEXT,
    };
  }

  if (totalStockValue === 0) {
    return {
      isConcentrated: false,
      statusLabel: 'Belum Berinvestasi (100% Kas)',
      concentratedTicker: null,
      maxAllocationRatio: 0,
      maxAllocationPercent: 0,
      allocationsByTicker,
      warningMessage: null,
    };
  }

  return {
    isConcentrated: false,
    statusLabel: 'Terdiversifikasi Sehat',
    concentratedTicker: maxTicker,
    maxAllocationRatio: maxRatio,
    maxAllocationPercent,
    allocationsByTicker,
    warningMessage: null,
  };
}

export const MACRO_NEWS_EVENTS: MacroNewsEvent[] = [
  {
    id: 'macro-central-bank-rate-hike',
    indicatorTitle: 'Suku Bunga Bank Sentral Naik',
    headline: 'Suku Bunga Bank Sentral Naik — Saham teknologi & pertumbuhan GOTO tertekan!',
    category: 'Kebijakan Moneter · Suku Bunga',
    tooltipExplanation:
      'Mengapa berdampak? Kenaikan suku bunga acuan meningkatkan biaya pinjaman modal (cost of capital) dan mendiskonto arus kas masa depan, sehingga menekan valuasi saham teknologi/pertumbuhan (GOTO).',
    impact: { ticker: 'GOTO', effect: 0.85 },
  },
  {
    id: 'macro-inflation-controlled',
    indicatorTitle: 'Inflasi Terkendali',
    headline: 'Inflasi Terkendali — Daya beli stabil & penyaluran kredit perbankan BBCA meningkat!',
    category: 'Indikator Makro · Inflasi',
    tooltipExplanation:
      'Mengapa berdampak? Inflasi yang rendah dan terkendali menjaga daya beli masyarakat serta menekan risiko kredit macet (NPL), sehingga memicu kenaikan permintaan kredit dan laba saham perbankan (BBCA).',
    impact: { ticker: 'BBCA', effect: 1.15 },
  },
  {
    id: 'macro-central-bank-rate-cut',
    indicatorTitle: 'Suku Bunga Bank Sentral Turun',
    headline: 'Suku Bunga Bank Sentral Turun — Likuiditas longgar dorong ekspansi saham teknologi GOTO!',
    category: 'Kebijakan Moneter · Suku Bunga',
    tooltipExplanation:
      'Mengapa berdampak? Penurunan suku bunga acuan menurunkan beban pendanaan ekspansi bisnis dan mendorong investor beralih ke aset berpertumbuhan tinggi seperti saham teknologi (GOTO).',
    impact: { ticker: 'GOTO', effect: 1.15 },
  },
  {
    id: 'macro-gdp-digital-growth',
    indicatorTitle: 'Pertumbuhan PDB Sektor Digital Menguat',
    headline: 'Pertumbuhan PDB Sektor Digital Menguat — Permintaan data & 5G dongkrak saham TLKM!',
    category: 'Indikator Makro · Produk Domestik Bruto (PDB)',
    tooltipExplanation:
      'Mengapa berdampak? Akselerasi PDB nasional meningkatkan konsumsi trafik data ritel dan belanja komputasi awan korporasi, yang secara langsung memperbesar pendapatan emiten telekomunikasi (TLKM).',
    impact: { ticker: 'TLKM', effect: 1.14 },
  },
  {
    id: 'macro-inflation-surge',
    indicatorTitle: 'Inflasi Melambung Tinggi',
    headline: 'Inflasi Melambung Tinggi — Risiko gagal bayar meningkat, sektor perbankan BBCA terkoreksi!',
    category: 'Indikator Makro · Inflasi',
    tooltipExplanation:
      'Mengapa berdampak? Lonjakan inflasi menggerus daya beli riil rumah tangga dan memaksa pencadangan risiko kredit perbankan meningkat, sehingga menekan harga saham bank (BBCA).',
    impact: { ticker: 'BBCA', effect: 0.90 },
  },
  {
    id: 'macro-rupiah-depreciation',
    indicatorTitle: 'Nilai Tukar Rupiah Melemah',
    headline: 'Nilai Tukar Rupiah Melemah — Biaya belanja modal perangkat impor tekan saham TLKM!',
    category: 'Indikator Makro · Nilai Tukar (Kurs)',
    tooltipExplanation:
      'Mengapa berdampak? Pelemahan nilai tukar Rupiah terhadap Dolar AS meningkatkan biaya impor perangkat jaringan dan beban utang valas, sehingga menggerus margin laba bersih emiten infrastruktur (TLKM).',
    impact: { ticker: 'TLKM', effect: 0.89 },
  },
];

export type RiskAnswerOption = 'A' | 'B' | 'C';

export interface RiskQuizQuestion {
  id: string;
  stepNumber: number;
  question: string;
  options: Array<{
    key: RiskAnswerOption;
    label: string;
    points: number;
  }>;
}

export interface RiskProfileResult {
  score: number;
  shortLabel: 'Konservatif' | 'Moderat' | 'Agresif';
  fullTitle:
    | 'Tipe Konservatif (Conservative)'
    | 'Tipe Moderat (Moderate)'
    | 'Tipe Agresif (Aggressive)';
  badgeText: 'Profil: Konservatif' | 'Profil: Moderat' | 'Profil: Agresif';
  description: string;
  allocationHint: string;
  colorHex: string;
}

export interface MarketRegulatorEntity {
  id: 'ojk' | 'bei' | 'kpei' | 'ksei';
  logoId: 'logo-ojk' | 'logo-bei' | 'logo-kpei' | 'logo-ksei';
  shortCode: 'OJK' | 'BEI' | 'KPEI' | 'KSEI';
  title: string;
  roleBadge: string;
  description: string;
  logoUrl: string;
  fallbackSvgDataUri: string;
}

function createLogoFallbackSvg(label: string, bgHex: string, borderHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="120" height="120" x="4" y="4" rx="22" fill="${bgHex}" stroke="${borderHex}" stroke-width="6"/><text x="64" y="74" font-family="Arial, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const MARKET_REGULATOR_STRUCTURE: {
  topLevel: MarketRegulatorEntity;
  sroLevel: [MarketRegulatorEntity, MarketRegulatorEntity, MarketRegulatorEntity];
} = {
  topLevel: {
    id: 'ojk',
    logoId: 'logo-ojk',
    shortCode: 'OJK',
    title: 'OJK (Otoritas Jasa Keuangan)',
    roleBadge: 'Lembaga Pengawas Sektor Jasa Keuangan',
    description: 'Mengatur dan mengawasi seluruh kegiatan di sektor jasa keuangan.',
    logoUrl: 'https://placehold.co/128x128/991b1b/ffffff?text=OJK',
    fallbackSvgDataUri: createLogoFallbackSvg('OJK', '#991b1b', '#fbbf24'),
  },
  sroLevel: [
    {
      id: 'bei',
      logoId: 'logo-bei',
      shortCode: 'BEI',
      title: 'BEI (Bursa Efek Indonesia)',
      roleBadge: 'Self-Regulatory Organization (SRO)',
      description: 'Fasilitator perdagangan efek.',
      logoUrl: 'https://placehold.co/128x128/1d4ed8/ffffff?text=BEI',
      fallbackSvgDataUri: createLogoFallbackSvg('BEI', '#1d4ed8', '#60a5fa'),
    },
    {
      id: 'kpei',
      logoId: 'logo-kpei',
      shortCode: 'KPEI',
      title: 'KPEI (Kliring Penjaminan Efek Indonesia)',
      roleBadge: 'Self-Regulatory Organization (SRO)',
      description: 'Lembaga kliring dan penjamin penyelesaian transaksi.',
      logoUrl: 'https://placehold.co/128x128/0369a1/ffffff?text=KPEI',
      fallbackSvgDataUri: createLogoFallbackSvg('KPEI', '#0369a1', '#38bdf8'),
    },
    {
      id: 'ksei',
      logoId: 'logo-ksei',
      shortCode: 'KSEI',
      title: 'KSEI (Kustodian Sentral Efek Indonesia)',
      roleBadge: 'Self-Regulatory Organization (SRO)',
      description: 'Tempat penyimpanan harta dan penyelesaian transaksi.',
      logoUrl: 'https://placehold.co/128x128/15803d/ffffff?text=KSEI',
      fallbackSvgDataUri: createLogoFallbackSvg('KSEI', '#15803d', '#4ade80'),
    },
  ],
};

export const RISK_OPTION_POINTS: Record<RiskAnswerOption, number> = {
  A: 1,
  B: 2,
  C: 3,
};

export const RISK_PROFILE_QUESTIONS: RiskQuizQuestion[] = [
  {
    id: 'q1',
    stepNumber: 1,
    question: 'Berapa lama kamu berencana untuk berinvestasi?',
    options: [
      { key: 'A', label: '< 1 tahun', points: 1 },
      { key: 'B', label: '1-5 tahun', points: 2 },
      { key: 'C', label: '> 5 tahun', points: 3 },
    ],
  },
  {
    id: 'q2',
    stepNumber: 2,
    question: 'Jika portofoliomu turun 15% dalam sebulan, apa yang kamu lakukan?',
    options: [
      { key: 'A', label: 'Jual semua', points: 1 },
      { key: 'B', label: 'Tahan dan tunggu', points: 2 },
      { key: 'C', label: 'Beli lagi selagi murah', points: 3 },
    ],
  },
  {
    id: 'q3',
    stepNumber: 3,
    question: 'Apa tujuan utamamu berinvestasi?',
    options: [
      { key: 'A', label: 'Menjaga uang tetap aman', points: 1 },
      { key: 'B', label: 'Mengalahkan inflasi', points: 2 },
      { key: 'C', label: 'Memaksimalkan pertumbuhan aset', points: 3 },
    ],
  },
];

/**
 * Calculates the player's Investment Risk Profile from their 3 answers (A=1, B=2, C=3):
 * - 3-4 points: Tipe Konservatif (Conservative)
 * - 5-7 points: Tipe Moderat (Moderate)
 * - 8-9 points: Tipe Agresif (Aggressive)
 */
export function calculateRiskProfile(
  answers: [RiskAnswerOption, RiskAnswerOption, RiskAnswerOption]
): RiskProfileResult {
  const score = answers.reduce((sum, ans) => sum + RISK_OPTION_POINTS[ans], 0);

  if (score <= 4) {
    return {
      score,
      shortLabel: 'Konservatif',
      fullTitle: 'Tipe Konservatif (Conservative)',
      badgeText: 'Profil: Konservatif',
      description:
        'Kamu mengutamakan keamanan modal dan stabilitas nilai investasi dengan fluktuasi minimal.',
      allocationHint:
        'Rekomendasi: Reksa Dana Pasar Uang & Obligasi Negara, ditambah saham perbankan blue-chip seperti BBCA.',
      colorHex: '#38bdf8',
    };
  }

  if (score <= 7) {
    return {
      score,
      shortLabel: 'Moderat',
      fullTitle: 'Tipe Moderat (Moderate)',
      badgeText: 'Profil: Moderat',
      description:
        'Kamu siap menerima fluktuasi pasar jangka pendek demi pertumbuhan aset yang seimbang di atas inflasi.',
      allocationHint:
        'Rekomendasi: Kombinasi Reksa Dana Campuran dan saham berfundamental kuat seperti BBCA & TLKM.',
      colorHex: '#f59e0b',
    };
  }

  return {
    score,
    shortLabel: 'Agresif',
    fullTitle: 'Tipe Agresif (Aggressive)',
    badgeText: 'Profil: Agresif',
    description:
      'Kamu berorientasi pada pertumbuhan aset maksimal jangka panjang dan siap memanfaatkan volatilitas pasar.',
    allocationHint:
      'Rekomendasi: Portofolio mayoritas Saham Pertumbuhan & Blue-Chip (BBCA, TLKM, GOTO) serta Reksa Dana Saham.',
    colorHex: '#22c55e',
  };
}

export const STARTING_BALANCE = 10_000_000; // Rp 10.000.000
export const SHARES_PER_LOT = 100; // 1 Lot = 100 shares

export const INITIAL_STOCKS: StockItem[] = [
  {
    ticker: 'BBCA',
    companyName: 'Bank Central Asia Tbk',
    sector: 'Banking & Finance',
    basePrice: 10000,
    currentPrice: 10000,
    previousPrice: 10000,
    changePercent: 0,
    priceHistory: [9850, 9920, 9980, 10000],
  },
  {
    ticker: 'TLKM',
    companyName: 'Telkom Indonesia Tbk',
    sector: 'Telecommunications',
    basePrice: 3000,
    currentPrice: 3000,
    previousPrice: 3000,
    changePercent: 0,
    priceHistory: [2960, 2980, 3010, 3000],
  },
  {
    ticker: 'GOTO',
    companyName: 'GoTo Gojek Tokopedia Tbk',
    sector: 'Technology & Digital',
    basePrice: 100,
    currentPrice: 100,
    previousPrice: 100,
    changePercent: 0,
    priceHistory: [98, 99, 101, 100],
  },
];

export function createInitialPortfolio(): PortfolioMap {
  return {
    BBCA: 0,
    TLKM: 0,
    GOTO: 0,
  };
}

/**
 * Formats a number as Indonesian Rupiah (e.g., 10000000 -> "Rp 10.000.000")
 */
export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return rounded < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

/**
 * Randomly fluctuates the current price of each stock by -5% to +5%.
 * When a Macroeconomic News Event is active (remainingTicks > 0), forces the affected
 * stock's price to trend heavily in the direction of the impact multiplier.
 */
export function fluctuateMarketPrices(
  stocks: StockItem[],
  randomFn: () => number = Math.random,
  activeNews?: ActiveMacroNewsState | null
): StockItem[] {
  return stocks.map((stock) => {
    const isAffectedByNews =
      Boolean(activeNews) &&
      activeNews!.remainingTicks > 0 &&
      activeNews!.event.impact.ticker === stock.ticker;

    let nextPrice: number;

    if (isAffectedByNews && activeNews) {
      const effectMultiplier = activeNews.event.impact.effect; // e.g. 1.15 or 0.85
      const totalDeltaPct = effectMultiplier - 1; // e.g. +0.15 or -0.15
      const ticks = Math.max(1, activeNews.totalTicks || 3);
      const variance = 0.92 + randomFn() * 0.16;
      const stepPct = (totalDeltaPct / ticks) * variance;
      const rawNextPrice = stock.currentPrice * (1 + stepPct);

      if (totalDeltaPct > 0) {
        nextPrice = Math.max(stock.currentPrice + 1, Math.round(rawNextPrice));
      } else if (totalDeltaPct < 0) {
        nextPrice = Math.max(1, Math.min(stock.currentPrice - 1, Math.round(rawNextPrice)));
      } else {
        nextPrice = Math.max(1, Math.round(rawNextPrice));
      }
    } else {
      // Normal market fluctuation: -5% to +5%
      const rawPct = randomFn() * 0.1 - 0.05;
      const rawNextPrice = stock.currentPrice * (1 + rawPct);
      nextPrice = Math.max(1, Math.round(rawNextPrice));
    }

    const changePercent = Number(
      (((nextPrice - stock.currentPrice) / stock.currentPrice) * 100).toFixed(2)
    );
    const updatedHistory = [...stock.priceHistory.slice(-9), nextPrice];

    return {
      ...stock,
      previousPrice: stock.currentPrice,
      currentPrice: nextPrice,
      changePercent,
      priceHistory: updatedHistory,
    };
  });
}

export interface TradeResult {
  ok: boolean;
  balance: number;
  portfolio: PortfolioMap;
  type: 'success' | 'error';
  message: string;
}

/**
 * Executes buying 1 Lot (100 shares) of a stock.
 * Deducts from balance and adds 100 shares to portfolio only if balance is sufficient.
 */
export function executeBuyOneLot(
  balance: number,
  portfolio: PortfolioMap,
  stock: StockItem
): TradeResult {
  const lotCost = stock.currentPrice * SHARES_PER_LOT;
  if (balance < lotCost) {
    return {
      ok: false,
      balance,
      portfolio,
      type: 'error',
      message: `Insufficient balance to buy 1 Lot (${SHARES_PER_LOT} shares) of ${stock.ticker}. Needed ${formatIDR(lotCost)}, available ${formatIDR(balance)}.`,
    };
  }

  const nextBalance = balance - lotCost;
  const currentShares = portfolio[stock.ticker] ?? 0;
  const nextPortfolio: PortfolioMap = {
    ...portfolio,
    [stock.ticker]: currentShares + SHARES_PER_LOT,
  };

  return {
    ok: true,
    balance: nextBalance,
    portfolio: nextPortfolio,
    type: 'success',
    message: `Successfully bought 1 Lot (${SHARES_PER_LOT} shares) of ${stock.ticker} @ ${formatIDR(stock.currentPrice)}/share (-${formatIDR(lotCost)}).`,
  };
}

/**
 * Executes selling 1 Lot (100 shares) of a stock.
 * Adds to balance and deducts 100 shares from portfolio only if shares owned >= 100.
 */
export function executeSellOneLot(
  balance: number,
  portfolio: PortfolioMap,
  stock: StockItem
): TradeResult {
  const currentShares = portfolio[stock.ticker] ?? 0;
  if (currentShares < SHARES_PER_LOT) {
    return {
      ok: false,
      balance,
      portfolio,
      type: 'error',
      message: `Insufficient shares to sell 1 Lot (${SHARES_PER_LOT} shares) of ${stock.ticker}. You currently own ${currentShares} shares.`,
    };
  }

  const lotProceeds = stock.currentPrice * SHARES_PER_LOT;
  const nextBalance = balance + lotProceeds;
  const nextPortfolio: PortfolioMap = {
    ...portfolio,
    [stock.ticker]: currentShares - SHARES_PER_LOT,
  };

  return {
    ok: true,
    balance: nextBalance,
    portfolio: nextPortfolio,
    type: 'success',
    message: `Successfully sold 1 Lot (${SHARES_PER_LOT} shares) of ${stock.ticker} @ ${formatIDR(stock.currentPrice)}/share (+${formatIDR(lotProceeds)}).`,
  };
}

export const SAVE_STORAGE_KEY = 'capital_market_save_data';

export interface CapitalMarketSaveData {
  balance: number;
  portfolio: PortfolioMap;
  riskProfile: RiskProfileResult | null;
  updatedAt?: number;
}

/**
 * Serializes balance, portfolio, and riskProfile into a single JSON string for localStorage.
 */
export function serializeSaveData(
  balance: number,
  portfolio: PortfolioMap,
  riskProfile: RiskProfileResult | null
): string {
  const payload: CapitalMarketSaveData = {
    balance,
    portfolio: {
      BBCA: portfolio.BBCA ?? 0,
      TLKM: portfolio.TLKM ?? 0,
      GOTO: portfolio.GOTO ?? 0,
    },
    riskProfile,
    updatedAt: Date.now(),
  };
  return JSON.stringify(payload);
}

/**
 * Safely parses and validates saved JSON from localStorage ('capital_market_save_data').
 * Returns null if the JSON is missing or malformed.
 */
export function parseSaveData(rawJson: string | null): CapitalMarketSaveData | null {
  if (!rawJson || typeof rawJson !== 'string') return null;

  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') return null;

    if (
      typeof parsed.balance !== 'number' ||
      !Number.isFinite(parsed.balance) ||
      parsed.balance < 0
    ) {
      return null;
    }

    const rawPort = parsed.portfolio;
    if (!rawPort || typeof rawPort !== 'object') return null;

    const bbca =
      typeof rawPort.BBCA === 'number' && Number.isFinite(rawPort.BBCA) && rawPort.BBCA >= 0
        ? Math.floor(rawPort.BBCA)
        : 0;
    const tlkm =
      typeof rawPort.TLKM === 'number' && Number.isFinite(rawPort.TLKM) && rawPort.TLKM >= 0
        ? Math.floor(rawPort.TLKM)
        : 0;
    const goto =
      typeof rawPort.GOTO === 'number' && Number.isFinite(rawPort.GOTO) && rawPort.GOTO >= 0
        ? Math.floor(rawPort.GOTO)
        : 0;

    let validRiskProfile: RiskProfileResult | null = null;
    if (
      parsed.riskProfile &&
      typeof parsed.riskProfile === 'object' &&
      typeof parsed.riskProfile.score === 'number' &&
      typeof parsed.riskProfile.shortLabel === 'string' &&
      typeof parsed.riskProfile.fullTitle === 'string' &&
      typeof parsed.riskProfile.badgeText === 'string'
    ) {
      validRiskProfile = parsed.riskProfile as RiskProfileResult;
    }

    return {
      balance: parsed.balance,
      portfolio: { BBCA: bbca, TLKM: tlkm, GOTO: goto },
      riskProfile: validRiskProfile,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Loads saved state from localStorage ('capital_market_save_data') if it exists,
 * or returns the default starting state (Rp 10.000.000 balance, 0 shares, null riskProfile).
 */
export function loadInitialMarketSaveData(
  storage?: Pick<Storage, 'getItem'> | null
): CapitalMarketSaveData {
  try {
    const targetStorage =
      storage !== undefined
        ? storage
        : typeof window !== 'undefined' && window.localStorage
        ? window.localStorage
        : null;

    if (targetStorage) {
      const raw = targetStorage.getItem(SAVE_STORAGE_KEY);
      const parsed = parseSaveData(raw);
      if (parsed) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }

  return {
    balance: STARTING_BALANCE,
    portfolio: createInitialPortfolio(),
    riskProfile: null,
  };
}

export const WELCOME_TUTORIAL_CONTENT = {
  title: 'Selamat Datang di Simulator Pasar Modal!',
  objective:
    'Tujuanmu di sini adalah belajar menjadi investor cerdas. Kamu diberikan modal awal Rp 10.000.000. Pelajari struktur pasar modal, kenali profil risikomu, dan cobalah berinvestasi di saham!',
  controls:
    'Cara Bermain: Gunakan WASD (Desktop) atau Joystick (Mobile) untuk berjalan. Dekati gedung dan tekan tombol Interaksi (atau tombol E) untuk belajar dan bertransaksi.',
  firstMission:
    'Misi Pertamamu: Kunjungi Kios Konsultan Keuangan untuk mengetahui Profil Risiko investasimu!',
  startButtonLabel: 'Mulai Bermain',
} as const;
