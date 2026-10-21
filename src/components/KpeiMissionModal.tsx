import { useState } from 'react';
import type { CapitalMarketPOI } from '../game/physics';
import type { RiskAnswerOption } from '../game/market';
import { soundFX } from '../game/sound';
import {
  KPEI_MISSION_TITLE,
  KPEI_CONCEPTS,
  KPEI_SETTLEMENT_STEPS,
  KPEI_QUIZ_QUESTIONS,
  evaluateKpeiMission,
  type KpeiMissionStage,
  type KpeiFlowStepId,
} from '../game/kpeiMission';

interface KpeiMissionModalProps {
  poi: CapitalMarketPOI;
  onClose: () => void;
}

function KpeiConceptSvgIcon({
  id,
}: {
  id: 'pengertian-kliring' | 'proses-netting' | 'penjaminan-transaksi' | 'mitigasi-risiko';
}) {
  if (id === 'pengertian-kliring') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 fill-none stroke-teal-400" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="7" y1="9" x2="17" y2="9" />
        <line x1="7" y1="13" x2="13" y2="13" />
        <polyline points="14 15 16 17 20 13" />
      </svg>
    );
  }
  if (id === 'proses-netting') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 fill-none stroke-sky-400" strokeWidth="2">
        <polyline points="16 3 21 3 21 8" />
        <line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" />
        <line x1="15" y1="15" x2="21" y2="21" />
        <line x1="4" y1="4" x2="9" y2="9" />
      </svg>
    );
  }
  if (id === 'penjaminan-transaksi') {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 fill-none stroke-amber-400" strokeWidth="2">
        <circle cx="9" cy="12" r="5" />
        <circle cx="15" cy="12" r="5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 fill-none stroke-emerald-400" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CheckIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} shrink-0 fill-none stroke-current`}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} shrink-0 fill-none stroke-current`}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function KpeiMissionModal({ poi, onClose }: KpeiMissionModalProps) {
  const [stage, setStage] = useState<KpeiMissionStage>('intro');
  const [selectedStepId, setSelectedStepId] = useState<KpeiFlowStepId>('clearing-netting');
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Array<RiskAnswerOption | null>>([null, null, null]);

  const currentQuestion = KPEI_QUIZ_QUESTIONS[quizIndex];
  const currentAnswer = answers[quizIndex];
  const isCurrentCorrect =
    currentAnswer !== null && currentAnswer === currentQuestion.correctOption;

  const answeredCount = answers.filter((a) => a !== null).length;
  const allAnswered = answeredCount === KPEI_QUIZ_QUESTIONS.length;
  const missionResult = evaluateKpeiMission(answers);

  const selectedFlowStep =
    KPEI_SETTLEMENT_STEPS.find((s) => s.id === selectedStepId) ?? KPEI_SETTLEMENT_STEPS[1];

  const handleSelectStage = (nextStage: KpeiMissionStage) => {
    soundFX.playInteract();
    setStage(nextStage);
  };

  const handleSelectQuizOption = (optionKey: RiskAnswerOption) => {
    const nextAnswers = [...answers];
    nextAnswers[quizIndex] = optionKey;
    setAnswers(nextAnswers);

    if (optionKey === currentQuestion.correctOption) {
      soundFX.playTradeSuccess();
    } else {
      soundFX.playTradeError();
    }
  };

  const handleNextQuestionOrResult = () => {
    soundFX.playInteract();
    if (quizIndex < KPEI_QUIZ_QUESTIONS.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setStage('result');
    }
  };

  const handleRestartMission = () => {
    soundFX.playInteract();
    setAnswers([null, null, null]);
    setQuizIndex(0);
    setStage('intro');
  };

  const handleRetakeQuizOnly = () => {
    soundFX.playInteract();
    setAnswers([null, null, null]);
    setQuizIndex(0);
    setStage('quiz');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="poi-modal-title"
      data-testid="poi-educational-modal"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 pointer-events-auto bg-slate-950/88 flex items-center justify-center p-2.5 sm:p-4"
    >
      <div
        data-testid="kpei-mission-modal"
        className="bg-[#0b1524] border-2 border-teal-400/65 rounded-2xl w-11/12 max-w-2xl p-3.5 sm:p-5 max-h-[92vh] overflow-y-auto shadow-2xl text-slate-100"
      >
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-teal-300">
              {poi.name.toUpperCase()} · SRO PASAR MODAL
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-md bg-teal-950/90 border border-teal-400/50 text-[10px] font-bold text-teal-200 shrink-0">
            {poi.shortLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2.5">
          <h2
            id="poi-modal-title"
            data-testid="kpei-mission-title"
            className="text-lg sm:text-2xl font-extrabold font-['Outfit'] text-white"
          >
            {KPEI_MISSION_TITLE}
          </h2>
          <span className="text-[11px] font-semibold text-slate-300">
            {stage === 'intro' && 'Tahap A dari 4 · Peran KPEI'}
            {stage === 'flow' && 'Tahap B dari 4 · Alur Kliring T+2'}
            {stage === 'quiz' &&
              `Tahap C dari 4 · Kuis (${quizIndex + 1}/${KPEI_QUIZ_QUESTIONS.length})`}
            {stage === 'result' && 'Tahap D dari 4 · Hasil Belajar'}
          </span>
        </div>

        {/* Interactive Stage Stepper Tabs */}
        <div
          role="tablist"
          aria-label="Tahapan Misi Kliring dan Penjaminan KPEI"
          className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-3 bg-slate-900/95 p-1 sm:p-1.5 rounded-xl border border-slate-800"
        >
          {(
            [
              { id: 'intro', step: 'A', mobileLabel: 'Peran', desktopLabel: 'Peran KPEI' },
              { id: 'flow', step: 'B', mobileLabel: 'Alur T+2', desktopLabel: 'Alur Kliring' },
              { id: 'quiz', step: 'C', mobileLabel: 'Kuis', desktopLabel: 'Kuis' },
              { id: 'result', step: 'D', mobileLabel: 'Hasil', desktopLabel: 'Hasil' },
            ] as Array<{
              id: KpeiMissionStage;
              step: string;
              mobileLabel: string;
              desktopLabel: string;
            }>
          ).map((tab) => {
            const isActive = stage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-testid={`kpei-stage-tab-${tab.id}`}
                onClick={() => handleSelectStage(tab.id)}
                className={`py-1.5 px-1.5 sm:px-2 rounded-lg text-[10px] sm:text-xs font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-400 text-slate-950 shadow'
                    : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] sm:text-[10px] font-mono shrink-0 ${
                    isActive
                      ? 'bg-slate-950 text-teal-300'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {tab.step}
                </span>
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.desktopLabel}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================
            TAHAP A — KENALI PERAN KPEI
        ================================================================= */}
        {stage === 'intro' && (
          <div data-testid="kpei-stage-intro">
            {/* Core Summary Banner */}
            <div className="bg-slate-900/95 border border-teal-400/45 rounded-xl p-3 sm:p-3.5 mb-2.5 shadow-inner">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 mb-0.5">
                PT KLIRING PENJAMINAN EFEK INDONESIA (KPEI)
              </div>
              <p
                data-testid="poi-educational-text"
                className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug"
              >
                {poi.educationalText}
              </p>
            </div>

            {/* 4 Visual Concept Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
              {KPEI_CONCEPTS.map((card) => (
                <div
                  key={card.id}
                  data-testid={`kpei-concept-card-${card.id}`}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        style={{ color: card.accentColor }}
                        className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider"
                      >
                        {card.badge}
                      </span>
                      <KpeiConceptSvgIcon id={card.id} />
                    </div>
                    <h3 className="text-sm font-extrabold text-white font-['Outfit'] mb-0.5">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-snug">
                      {card.description}
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-800/90 text-[11px] font-semibold text-teal-300 leading-snug">
                    ✓ {card.highlight}
                  </div>
                </div>
              ))}
            </div>

            {/* Next Stage Action */}
            <div className="flex justify-end mb-3">
              <button
                type="button"
                data-testid="kpei-next-to-flow-btn"
                onClick={() => handleSelectStage('flow')}
                className="w-full sm:w-auto py-2 px-5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shadow-lg"
              >
                Lanjut: Lihat Alur Kliring &amp; Penjaminan →
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            TAHAP B — ALUR KLIRING & PENJAMINAN TRANSAKSI (T+0 HINGGA T+2)
        ================================================================= */}
        {stage === 'flow' && (
          <div data-testid="kpei-stage-flow">
            <p className="text-xs sm:text-sm text-slate-300 mb-2.5 leading-snug">
              Klik setiap tahapan di bawah untuk mempelajari bagaimana transaksi jual-beli sahammu di Bursa Efek diproses dan dijamin oleh KPEI hingga selesai pada <strong className="text-white">T+2</strong>:
            </p>

            {/* 4 Step Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2.5">
              {KPEI_SETTLEMENT_STEPS.map((step) => {
                const isSelected = step.id === selectedStepId;
                return (
                  <button
                    key={step.id}
                    type="button"
                    data-testid={`kpei-flow-card-${step.id}`}
                    onClick={() => {
                      soundFX.playInteract();
                      setSelectedStepId(step.id);
                    }}
                    className={`text-left rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-teal-400 ring-1 ring-teal-400/50 shadow-lg'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          style={{ color: step.accentHex }}
                          className="text-[10px] font-extrabold uppercase tracking-wider"
                        >
                          {step.stepCode}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-200">
                          {step.timelineBadge}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-white font-['Outfit'] mb-0.5">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-snug">
                        {step.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/90 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span className="truncate">{step.institution}</span>
                      <span className="inline-flex items-center gap-1 text-teal-300 font-bold shrink-0 ml-2">
                        {isSelected ? (
                          <>
                            <CheckIcon className="w-3 h-3" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <span>Detail</span>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Highlighted Detail Box for Selected Step */}
            <div
              data-testid="kpei-selected-flow-detail"
              className="bg-slate-900/95 border border-amber-400/45 rounded-xl p-3 mb-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                  MANFAAT BAGI INVESTOR · {selectedFlowStep.stepCode} ({selectedFlowStep.timelineBadge})
                </span>
                <span className="text-[10px] font-mono font-bold text-teal-300">
                  Lembaga: {selectedFlowStep.institution}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-snug">
                <strong className="text-white">Dampak Langsung: </strong>
                {selectedFlowStep.investorBenefit}
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <button
                type="button"
                data-testid="kpei-back-to-intro-btn"
                onClick={() => handleSelectStage('intro')}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                ← Kembali ke Peran KPEI
              </button>
              <button
                type="button"
                data-testid="kpei-start-quiz-btn"
                onClick={() => handleSelectStage('quiz')}
                className="py-2 px-5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shadow-lg"
              >
                Mulai Kuis Kliring &amp; Penjaminan →
              </button>
            </div>
          </div>
        )}

        {/* =================================================================
            TAHAP C — TANTANGAN KUIS & UMPAN BALIK LANGSUNG
        ================================================================= */}
        {stage === 'quiz' && (
          <div data-testid="kpei-stage-quiz">
            {/* Progress Bar */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {KPEI_QUIZ_QUESTIONS.map((q, idx) => (
                <div
                  key={q.id}
                  className={`h-1.5 rounded-full transition-colors ${
                    answers[idx] !== null
                      ? answers[idx] === q.correctOption
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                      : idx === quizIndex
                        ? 'bg-teal-400'
                        : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>

            {/* Question Box */}
            <div className="bg-slate-900/95 border border-teal-400/40 rounded-xl p-3.5 mb-3 shadow">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300">
                  PERTANYAAN {currentQuestion.stepNumber} DARI {KPEI_QUIZ_QUESTIONS.length} ·{' '}
                  {currentQuestion.topicBadge}
                </span>
              </div>
              <p
                data-testid="kpei-quiz-question-text"
                className="text-xs sm:text-base font-bold text-white leading-snug"
              >
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-2 mb-3">
              {currentQuestion.options.map((opt) => {
                const isChosen = currentAnswer === opt.key;
                const isCorrectOpt = opt.key === currentQuestion.correctOption;

                let btnStyle =
                  'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-100';
                if (currentAnswer !== null) {
                  if (isCorrectOpt) {
                    btnStyle =
                      'bg-emerald-950/75 border-emerald-400 text-emerald-100';
                  } else if (isChosen) {
                    btnStyle = 'bg-rose-950/75 border-rose-400 text-rose-100';
                  }
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    data-testid={`kpei-quiz-option-${opt.key}`}
                    onClick={() => handleSelectQuizOption(opt.key)}
                    className={`w-full p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono font-extrabold text-xs flex items-center justify-center shrink-0 border ${
                          isChosen
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : 'bg-slate-800 text-amber-300 border-slate-600'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold leading-snug">
                        {opt.label}
                      </span>
                    </div>
                    {currentAnswer !== null && isCorrectOpt && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-300 shrink-0">
                        <CheckIcon className="w-3.5 h-3.5" />
                        <span>Tepat</span>
                      </span>
                    )}
                    {currentAnswer !== null && isChosen && !isCorrectOpt && (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-rose-300 shrink-0">
                        <CrossIcon className="w-3.5 h-3.5" />
                        <span>Pilihanmu</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Educational Feedback Box */}
            {currentAnswer !== null && (
              <div
                data-testid="kpei-quiz-feedback"
                className={`rounded-xl p-3 mb-3 border text-xs leading-relaxed ${
                  isCurrentCorrect
                    ? 'bg-emerald-950/55 border-emerald-400/70 text-emerald-100'
                    : 'bg-amber-950/55 border-amber-400/70 text-amber-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[10px] mb-1">
                  {isCurrentCorrect ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>JAWABAN TEPAT</span>
                    </>
                  ) : (
                    <span>💡 PEMBAHASAN EDUKASI</span>
                  )}
                </div>
                <p>
                  {isCurrentCorrect
                    ? currentQuestion.correctFeedback
                    : currentQuestion.incorrectFeedback}
                </p>
              </div>
            )}

            {/* Quiz Navigation Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {quizIndex > 0 ? (
                  <button
                    type="button"
                    data-testid="kpei-prev-question-btn"
                    onClick={() => {
                      soundFX.playInteract();
                      setQuizIndex((prev) => Math.max(0, prev - 1));
                    }}
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    ← Soal Sebelumnya
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectStage('flow')}
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                  >
                    ← Lihat Alur Kliring
                  </button>
                )}
              </div>

              {currentAnswer !== null && (
                <button
                  type="button"
                  data-testid="kpei-next-question-btn"
                  onClick={handleNextQuestionOrResult}
                  className="py-2 px-5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shadow-lg"
                >
                  {quizIndex < KPEI_QUIZ_QUESTIONS.length - 1
                    ? 'Soal Berikutnya →'
                    : 'Lihat Hasil Belajar →'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* =================================================================
            TAHAP D — HASIL BELAJAR & RINGKASAN MISI
        ================================================================= */}
        {stage === 'result' && (
          <div data-testid="kpei-stage-result">
            {/* Score & Badge Banner */}
            <div className="bg-slate-900/95 border-2 border-teal-400/60 rounded-xl p-3.5 sm:p-4 mb-3 text-center shadow-lg">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-teal-300">
                HASIL MISI KLIRING &amp; PENJAMINAN (KPEI)
              </div>
              <div
                data-testid="kpei-result-score"
                className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums text-white mt-1"
              >
                Skor: {missionResult.correctCount} / {missionResult.totalQuestions} (
                {missionResult.scorePercent}%)
              </div>
              <div
                data-testid="kpei-result-badge"
                className="inline-block mt-1.5 px-3 py-0.5 rounded-lg bg-amber-400/20 border border-amber-400/65 text-amber-300 text-xs font-extrabold"
              >
                Predikat: {missionResult.badgeTitle}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed mt-2">
                {missionResult.summaryMessage}
              </p>
              {!allAnswered && (
                <p className="text-[11px] text-amber-300 font-semibold mt-1.5">
                  Kamu baru menjawab {answeredCount} dari {missionResult.totalQuestions} pertanyaan kuis.
                </p>
              )}
            </div>

            {/* Key Takeaways Checklist */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 mb-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300 mb-1.5">
                RINGKASAN POIN PENTING KPEI
              </div>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {missionResult.keyTakeaways.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-teal-400">
                      <CheckIcon className="w-3.5 h-3.5" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Retry / Review Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <button
                type="button"
                data-testid="kpei-review-material-btn"
                onClick={handleRestartMission}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Pelajari Ulang dari Tahap A
              </button>
              <button
                type="button"
                data-testid="kpei-retake-quiz-btn"
                onClick={handleRetakeQuizOnly}
                className="py-2 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Ulangi Kuis Saja
              </button>
            </div>
          </div>
        )}

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
              onClose();
            }}
            className="py-2 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm tracking-wide transition-colors cursor-pointer shadow-lg shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
