import { useState, useEffect } from 'react';
import {
  RISK_PROFILE_QUESTIONS,
  type RiskAnswerOption,
} from '../game/market';
import { useMarket } from '../game/MarketContext';

interface RiskProfileModalProps {
  onClose: () => void;
}

export function RiskProfileModal({ onClose }: RiskProfileModalProps) {
  const [quizStep, setQuizStep] = useState<number>(0); // 0 = Q1, 1 = Q2, 2 = Q3, 3 = Result Summary
  const [quizAnswers, setQuizAnswers] = useState<
    [RiskAnswerOption | null, RiskAnswerOption | null, RiskAnswerOption | null]
  >([null, null, null]);

  const { riskProfile, submitRiskQuiz } = useMarket();

  useEffect(() => {
    setQuizStep(0);
    setQuizAnswers([null, null, null]);
  }, []);

  const handleSelectQuizOption = (stepIdx: number, optionKey: RiskAnswerOption) => {
    const updated: [
      RiskAnswerOption | null,
      RiskAnswerOption | null,
      RiskAnswerOption | null,
    ] = [...quizAnswers] as [
      RiskAnswerOption | null,
      RiskAnswerOption | null,
      RiskAnswerOption | null,
    ];
    updated[stepIdx] = optionKey;
    setQuizAnswers(updated);

    if (stepIdx < 2) {
      setQuizStep(stepIdx + 1);
    } else if (updated[0] && updated[1] && updated[2]) {
      submitRiskQuiz([updated[0], updated[1], updated[2]]);
      setQuizStep(3);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="risk-profile-modal-title"
      data-testid="risk-profile-modal"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 pointer-events-auto bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="w-11/12 max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#0b1628] via-[#0d1c33] to-[#081221] border-2 border-amber-400/55 p-4 sm:p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-400">
            FINANCIAL ADVISOR KIOSK · RISK ASSESSMENT
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-[10px] font-semibold text-slate-200 shrink-0">
            {quizStep < 3 ? `Question ${quizStep + 1} / 3` : 'Result'}
          </span>
        </div>

        <h2
          id="risk-profile-modal-title"
          className="text-xl sm:text-2xl font-extrabold font-['Outfit'] text-white mb-3"
        >
          Risk Profile Test
        </h2>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {[0, 1, 2].map((idx) => (
            <div
              key={`step-bar-${idx}`}
              className={`h-1.5 rounded-full transition-colors ${
                quizStep > idx
                  ? 'bg-emerald-400'
                  : quizStep === idx
                  ? 'bg-amber-400'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {quizStep < 3 ? (
          /* MULTI-STEP QUIZ QUESTIONS (Q1, Q2, Q3) */
          <div data-testid={`risk-question-step-${quizStep + 1}`}>
            {/* Question Panel */}
            <div className="w-full mb-4 rounded-xl bg-gradient-to-br from-slate-900/95 to-[#0f2238]/90 border border-sky-400/35 p-3.5 sm:p-4 shadow-lg">
              <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-300 mb-1">
                PERTANYAAN {RISK_PROFILE_QUESTIONS[quizStep].stepNumber} DARI 3
              </div>
              <p
                data-testid="risk-question-text"
                className="text-xs sm:text-base font-bold text-white leading-snug"
              >
                {RISK_PROFILE_QUESTIONS[quizStep].question}
              </p>
            </div>

            {/* Quiz Answer Options (A, B, C) */}
            <div className="space-y-2.5 mb-5">
              {RISK_PROFILE_QUESTIONS[quizStep].options.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  data-testid={`risk-option-${opt.key}`}
                  onClick={() => handleSelectQuizOption(quizStep, opt.key)}
                  className="w-full p-3 sm:p-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/95 border border-slate-700/80 hover:border-amber-400/65 active:scale-[0.99] transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/25 border border-amber-400/60 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-300 font-mono font-extrabold text-xs flex items-center justify-center shrink-0 transition-colors">
                      {opt.key}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-100 text-left">
                      {opt.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300/90 shrink-0">
                    +{opt.points} pt
                  </span>
                </button>
              ))}
            </div>

            {quizStep > 0 && (
              <button
                type="button"
                onClick={() => setQuizStep((prev) => Math.max(0, prev - 1))}
                className="text-xs font-semibold text-slate-300 hover:text-white underline cursor-pointer mb-3"
              >
                ← Back to Previous Question
              </button>
            )}
          </div>
        ) : (
          /* QUIZ RESULT SUMMARY SCREEN */
          riskProfile && (
            <div data-testid="risk-profile-result" className="mb-5">
              {/* Result Banner */}
              <div className="w-full mb-3.5 rounded-xl bg-gradient-to-br from-slate-900/95 via-[#0f2238]/95 to-emerald-950/40 border-2 border-emerald-400/50 p-4 sm:p-5 shadow-lg flex flex-col items-center justify-center text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  TOTAL SCORE: {riskProfile.score} / 9 POINTS
                </div>
                <div
                  data-testid="risk-profile-title"
                  className="text-base sm:text-xl font-extrabold text-white mt-1 font-['Outfit']"
                >
                  {riskProfile.fullTitle}
                </div>
                <div className="inline-block mt-1.5 px-3 py-0.5 rounded-lg bg-amber-400/20 border border-amber-400/60 text-amber-300 text-xs font-extrabold">
                  {riskProfile.badgeText}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-200 leading-relaxed mt-2.5">
                  {riskProfile.description}
                </p>
              </div>

              <div className="bg-slate-900/85 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed mb-3">
                {riskProfile.allocationHint}
              </div>

              <button
                type="button"
                data-testid="retake-risk-quiz"
                onClick={() => {
                  setQuizAnswers([null, null, null]);
                  setQuizStep(0);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-amber-400/50 active:scale-[0.99] text-xs font-extrabold text-amber-300 transition-all cursor-pointer shadow"
              >
                Ulangi Tes Profil Risiko (Retake Quiz)
              </button>
            </div>
          )
        )}

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
