import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  INITIAL_STOCKS,
  STARTING_BALANCE,
  MACRO_NEWS_EVENTS,
  SAVE_STORAGE_KEY,
  createInitialPortfolio,
  fluctuateMarketPrices,
  executeBuyOneLot,
  executeSellOneLot,
  calculateRiskProfile,
  evaluatePortfolioDiversification,
  loadInitialMarketSaveData,
  serializeSaveData,
  type StockItem,
  type StockTicker,
  type PortfolioMap,
  type TradeToast,
  type RiskAnswerOption,
  type RiskProfileResult,
  type MacroNewsEvent,
  type ActiveMacroNewsState,
  type DiversificationStatus,
} from './market';
import { soundFX } from './sound';

interface MarketContextValue {
  balance: number;
  portfolio: PortfolioMap;
  stocks: StockItem[];
  toast: TradeToast | null;
  riskProfile: RiskProfileResult | null;
  activeNews: ActiveMacroNewsState | null;
  diversificationStatus: DiversificationStatus;
  totalPortfolioValue: number;
  totalEquity: number;
  buyOneLot: (ticker: StockTicker) => void;
  sellOneLot: (ticker: StockTicker) => void;
  submitRiskQuiz: (answers: [RiskAnswerOption, RiskAnswerOption, RiskAnswerOption]) => RiskProfileResult;
  triggerNewsEvent: (customEvent?: MacroNewsEvent) => MacroNewsEvent;
  dismissNewsBanner: () => void;
  clearToast: () => void;
  resetMarketState: () => void;
  clearSaveAndResetMarket: () => void;
}

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({ children }: { children: ReactNode }) {
  const initialSave = useMemo(() => loadInitialMarketSaveData(), []);

  const [balance, setBalance] = useState<number>(() => initialSave.balance);
  const [portfolio, setPortfolio] = useState<PortfolioMap>(() => initialSave.portfolio);
  const [stocks, setStocks] = useState<StockItem[]>(() => INITIAL_STOCKS);
  const [toast, setToast] = useState<TradeToast | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskProfileResult | null>(
    () => initialSave.riskProfile
  );
  const [activeNews, setActiveNews] = useState<ActiveMacroNewsState | null>(null);

  const activeNewsRef = useRef<ActiveMacroNewsState | null>(null);
  const lastNewsIdxRef = useRef<number>(-1);
  const isFirstMountRef = useRef<boolean>(true);
  const skipNextAutoSaveRef = useRef<boolean>(false);

  // Automatically serialize and persist balance, portfolio, and riskProfile to localStorage ('capital_market_save_data') whenever they change
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }
    try {
      const json = serializeSaveData(balance, portfolio, riskProfile);
      window.localStorage.setItem(SAVE_STORAGE_KEY, json);
    } catch {
      // Ignore storage write errors in restricted environments
    }
  }, [balance, portfolio, riskProfile]);

  const triggerNewsEvent = useCallback((customEvent?: MacroNewsEvent): MacroNewsEvent => {
    let chosen: MacroNewsEvent;
    if (customEvent) {
      chosen = customEvent;
    } else {
      let nextIdx = Math.floor(Math.random() * MACRO_NEWS_EVENTS.length);
      if (nextIdx === lastNewsIdxRef.current && MACRO_NEWS_EVENTS.length > 1) {
        nextIdx = (nextIdx + 1) % MACRO_NEWS_EVENTS.length;
      }
      lastNewsIdxRef.current = nextIdx;
      chosen = MACRO_NEWS_EVENTS[nextIdx];
    }

    const newsState: ActiveMacroNewsState = {
      event: chosen,
      remainingTicks: 3, // Forces affected stock price to trend heavily for the next 3 updates
      totalTicks: 3,
      triggeredAt: Date.now(),
    };

    activeNewsRef.current = newsState;
    setActiveNews(newsState);
    soundFX.playInteract();
    return chosen;
  }, []);

  const dismissNewsBanner = useCallback(() => {
    activeNewsRef.current = null;
    setActiveNews(null);
  }, []);

  // Market Engine: every 3 seconds, update stock prices.
  // If a Macroeconomic News Event is active, force the affected stock to trend heavily in the impact direction for 3 price updates.
  useEffect(() => {
    const interval = window.setInterval(() => {
      const currentNews = activeNewsRef.current;
      setStocks((prevStocks) =>
        fluctuateMarketPrices(prevStocks, Math.random, currentNews)
      );

      if (currentNews && currentNews.remainingTicks > 0) {
        const nextRemaining = currentNews.remainingTicks - 1;
        if (nextRemaining <= 0) {
          activeNewsRef.current = null;
          setActiveNews(null);
        } else {
          const updatedNews: ActiveMacroNewsState = {
            ...currentNews,
            remainingTicks: nextRemaining,
          };
          activeNewsRef.current = updatedNews;
          setActiveNews(updatedNews);
        }
      }
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  // Macroeconomic News Event Engine: triggers a random news event every 15-20 seconds
  useEffect(() => {
    let timeoutId: number;

    const scheduleNextNews = () => {
      const delayMs = 15000 + Math.floor(Math.random() * 5001); // 15,000ms to 20,000ms
      timeoutId = window.setTimeout(() => {
        triggerNewsEvent();
        scheduleNextNews();
      }, delayMs);
    };

    scheduleNextNews();
    return () => window.clearTimeout(timeoutId);
  }, [triggerNewsEvent]);

  // Auto-dismiss trade toast after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const buyOneLot = useCallback(
    (ticker: StockTicker) => {
      const targetStock = stocks.find((s) => s.ticker === ticker);
      if (!targetStock) return;

      const result = executeBuyOneLot(balance, portfolio, targetStock);
      if (result.ok) {
        soundFX.playTradeSuccess();
        setBalance(result.balance);
        setPortfolio(result.portfolio);
        try {
          window.localStorage.setItem(
            SAVE_STORAGE_KEY,
            serializeSaveData(result.balance, result.portfolio, riskProfile)
          );
        } catch {
          // Ignore storage error
        }
      } else {
        soundFX.playTradeError();
      }
      setToast({
        id: Date.now() + Math.random(),
        type: result.type,
        message: result.message,
      });
    },
    [balance, portfolio, stocks, riskProfile]
  );

  const sellOneLot = useCallback(
    (ticker: StockTicker) => {
      const targetStock = stocks.find((s) => s.ticker === ticker);
      if (!targetStock) return;

      const result = executeSellOneLot(balance, portfolio, targetStock);
      if (result.ok) {
        soundFX.playTradeSuccess();
        setBalance(result.balance);
        setPortfolio(result.portfolio);
        try {
          window.localStorage.setItem(
            SAVE_STORAGE_KEY,
            serializeSaveData(result.balance, result.portfolio, riskProfile)
          );
        } catch {
          // Ignore storage error
        }
      } else {
        soundFX.playTradeError();
      }
      setToast({
        id: Date.now() + Math.random(),
        type: result.type,
        message: result.message,
      });
    },
    [balance, portfolio, stocks, riskProfile]
  );

  const submitRiskQuiz = useCallback(
    (answers: [RiskAnswerOption, RiskAnswerOption, RiskAnswerOption]) => {
      const calculated = calculateRiskProfile(answers);
      soundFX.playTradeSuccess();
      setRiskProfile(calculated);
      try {
        window.localStorage.setItem(
          SAVE_STORAGE_KEY,
          serializeSaveData(balance, portfolio, calculated)
        );
      } catch {
        // Ignore storage error
      }
      return calculated;
    },
    [balance, portfolio]
  );

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const resetMarketState = useCallback(() => {
    skipNextAutoSaveRef.current = true;
    try {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
    setBalance(STARTING_BALANCE);
    setPortfolio(createInitialPortfolio());
    setStocks(INITIAL_STOCKS);
    setToast(null);
    setRiskProfile(null);
    activeNewsRef.current = null;
    setActiveNews(null);
  }, []);

  const clearSaveAndResetMarket = useCallback(() => {
    skipNextAutoSaveRef.current = true;
    try {
      window.localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
    setBalance(STARTING_BALANCE);
    setPortfolio(createInitialPortfolio());
    setStocks(INITIAL_STOCKS);
    setToast(null);
    setRiskProfile(null);
    activeNewsRef.current = null;
    setActiveNews(null);
  }, []);

  const totalPortfolioValue = useMemo(() => {
    return stocks.reduce((sum, s) => {
      const shares = portfolio[s.ticker] ?? 0;
      return sum + shares * s.currentPrice;
    }, 0);
  }, [stocks, portfolio]);

  const totalEquity = balance + totalPortfolioValue;

  const diversificationStatus = useMemo(
    () => evaluatePortfolioDiversification(balance, portfolio, stocks),
    [balance, portfolio, stocks]
  );

  const value = useMemo<MarketContextValue>(
    () => ({
      balance,
      portfolio,
      stocks,
      toast,
      riskProfile,
      activeNews,
      diversificationStatus,
      totalPortfolioValue,
      totalEquity,
      buyOneLot,
      sellOneLot,
      submitRiskQuiz,
      triggerNewsEvent,
      dismissNewsBanner,
      clearToast,
      resetMarketState,
      clearSaveAndResetMarket,
    }),
    [
      balance,
      portfolio,
      stocks,
      toast,
      riskProfile,
      activeNews,
      diversificationStatus,
      totalPortfolioValue,
      totalEquity,
      buyOneLot,
      sellOneLot,
      submitRiskQuiz,
      triggerNewsEvent,
      dismissNewsBanner,
      clearToast,
      resetMarketState,
      clearSaveAndResetMarket,
    ]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return ctx;
}
