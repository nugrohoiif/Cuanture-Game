import type { RiskAnswerOption } from './market';

export type KpeiMissionStage = 'intro' | 'flow' | 'quiz' | 'result';

export interface KpeiConceptCard {
  id: 'pengertian-kliring' | 'proses-netting' | 'penjaminan-transaksi' | 'mitigasi-risiko';
  badge: string;
  title: string;
  description: string;
  highlight: string;
  accentColor: string;
}

export type KpeiFlowStepId =
  | 'trade-execution'
  | 'clearing-netting'
  | 'ccp-guarantee'
  | 'settlement-t2';

export interface KpeiFlowStep {
  id: KpeiFlowStepId;
  stepCode: string;
  timelineBadge: string;
  title: string;
  institution: string;
  description: string;
  investorBenefit: string;
  accentHex: string;
}

export interface KpeiQuizOption {
  key: RiskAnswerOption;
  label: string;
}

export interface KpeiQuizQuestion {
  id: string;
  stepNumber: number;
  topicBadge: string;
  question: string;
  options: [KpeiQuizOption, KpeiQuizOption, KpeiQuizOption];
  correctOption: RiskAnswerOption;
  correctFeedback: string;
  incorrectFeedback: string;
}

export interface KpeiMissionResult {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  badgeTitle: 'Pemula Kliring' | 'Penjelajah Kliring' | 'Master Kliring & Penjaminan';
  summaryMessage: string;
  keyTakeaways: string[];
}

export const KPEI_MISSION_TITLE = 'Misi Kliring & Penjaminan Transaksi';

export const KPEI_CONCEPTS: KpeiConceptCard[] = [
  {
    id: 'pengertian-kliring',
    badge: 'KONSEP 1 · KLIRING BURSA',
    title: 'Apa Itu Kliring Transaksi?',
    description:
      'Proses penentuan hak dan kewajiban (baik berupa efek maupun dana) yang timbul dari setiap transaksi jual-beli di Bursa Efek.',
    highlight: 'Memastikan siapa berhak menerima saham apa dan siapa wajib membayar berapa.',
    accentColor: '#14b8a6',
  },
  {
    id: 'proses-netting',
    badge: 'KONSEP 2 · EFISIENSI NETTING',
    title: 'Mekanisme Kliring secara Netting',
    description:
      'KPEI menghitung selisih bersih (netto) dari seluruh transaksi jual dan beli Anggota Kliring pada hari bursa yang sama.',
    highlight: 'Menyederhanakan ribuan transaksi menjadi satu kewajiban/hak bersih yang efisien.',
    accentColor: '#38bdf8',
  },
  {
    id: 'penjaminan-transaksi',
    badge: 'KONSEP 3 · CENTRAL COUNTERPARTY',
    title: 'Penjaminan Penyelesaian Transaksi',
    description:
      'Sebagai Central Counterparty (CCP), KPEI mengambil alih posisi hukum sebagai pembeli bagi setiap penjual dan penjual bagi setiap pembeli.',
    highlight: 'Menjamin transaksi bursa pasti diselesaikan tepat waktu sesuai ketentuan.',
    accentColor: '#fbbf24',
  },
  {
    id: 'mitigasi-risiko',
    badge: 'KONSEP 4 · KEAMANAN PASAR',
    title: 'Mitigasi Risiko Gagal Serah & Bayar',
    description:
      'KPEI mengelola agunan, batasan risiko, dan Dana Jaminan untuk menanggulangi potensi kegagalan penyelesaian oleh Anggota Kliring.',
    highlight: 'Menjaga kepercayaan investor terhadap integritas pasar modal Indonesia.',
    accentColor: '#34d399',
  },
];

export const KPEI_SETTLEMENT_STEPS: KpeiFlowStep[] = [
  {
    id: 'trade-execution',
    stepCode: 'TAHAP 1',
    timelineBadge: 'T+0 · Hari Transaksi',
    title: 'Order Bertemu (Matched) di Bursa Efek',
    institution: 'Bursa Efek Indonesia (BEI)',
    description:
      'Saat kamu menekan tombol Beli atau Jual saham melalui Perusahaan Sekuritas dan harga cocok, transaksi tercatat matched di mesin perdagangan BEI.',
    investorBenefit:
      'Data transaksi dari BEI langsung dikirimkan secara elektronik ke sistem KPEI untuk diproses.',
    accentHex: '#3b82f6',
  },
  {
    id: 'clearing-netting',
    stepCode: 'TAHAP 2',
    timelineBadge: 'T+0 s.d. T+1 · Proses Kliring',
    title: 'Verifikasi, Kliring & Perhitungan Netting',
    institution: 'KPEI (Kliring Penjaminan Efek Indonesia)',
    description:
      'KPEI memvalidasi seluruh transaksi dan melakukan netting untuk menentukan jumlah bersih saham yang harus diserahkan atau dana yang harus dibayarkan oleh setiap Anggota Kliring.',
    investorBenefit:
      'Menerbitkan Daftar Hasil Kliring (DHK) yang menjadi acuan resmi penyelesaian hak dan kewajiban.',
    accentHex: '#14b8a6',
  },
  {
    id: 'ccp-guarantee',
    stepCode: 'TAHAP 3',
    timelineBadge: 'T+1 s.d. T+2 · Penjaminan CCP',
    title: 'Penjaminan Kepastian Penyelesaian',
    institution: 'KPEI sebagai Central Counterparty (CCP)',
    description:
      'KPEI memantau kecukupan agunan dan menjamin bahwa kewajiban serah efek maupun bayar dana tetap terlaksana meskipun ada kendala pada salah satu pihak.',
    investorBenefit:
      'Investor tidak perlu khawatir lawan transaksinya gagal bayar atau gagal menyerahkan saham.',
    accentHex: '#f59e0b',
  },
  {
    id: 'settlement-t2',
    stepCode: 'TAHAP 4',
    timelineBadge: 'T+2 · Hari Penyelesaian',
    title: 'Penyelesaian Transaksi (Settlement)',
    institution: 'Sinergi KPEI, KSEI & Bank Pembayar',
    description:
      'Pada hari bursa ke-2 setelah transaksi (T+2), instruksi KPEI dieksekusi: saham berpindah ke rekening efek pembeli dan dana masuk ke rekening penjual.',
    investorBenefit:
      'Transaksi tuntas dengan aman, akurat, dan tercatat resmi atas nama investor.',
    accentHex: '#22c55e',
  },
];

export const KPEI_QUIZ_QUESTIONS: KpeiQuizQuestion[] = [
  {
    id: 'kpei-q1',
    stepNumber: 1,
    topicBadge: 'FUNGSI UTAMA KPEI',
    question:
      'Setelah order beli dan jual saham bertemu (matched) di Bursa Efek Indonesia, apakah peran utama yang dijalankan oleh KPEI?',
    options: [
      {
        key: 'A',
        label: 'Menentukan harga saham harian dan memilih saham untuk portofolio investor',
      },
      {
        key: 'B',
        label: 'Melakukan kliring (perhitungan hak & kewajiban) serta menjamin penyelesaian transaksi bursa',
      },
      {
        key: 'C',
        label: 'Memberikan pinjaman modal awal gratis kepada seluruh investor ritel',
      },
    ],
    correctOption: 'B',
    correctFeedback:
      'Tepat! KPEI bertugas menyelenggarakan kliring (termasuk netting hak & kewajiban) dan menjamin penyelesaian transaksi bursa agar berjalan aman dan tepat waktu.',
    incorrectFeedback:
      'Belum tepat. KPEI tidak menentukan harga saham atau mengelola portofolio, melainkan menyelenggarakan kliring dan penjaminan penyelesaian transaksi bursa.',
  },
  {
    id: 'kpei-q2',
    stepNumber: 2,
    topicBadge: 'MEKANISME NETTING & PENJAMINAN',
    question:
      'Mengapa proses Netting dan peran Central Counterparty (CCP) oleh KPEI sangat penting dalam perdagangan pasar modal?',
    options: [
      {
        key: 'A',
        label: 'Menyederhanakan penyelesaian menjadi hak/kewajiban bersih serta mencegah risiko gagal serah atau gagal bayar',
      },
      {
        key: 'B',
        label: 'Menjamin bahwa harga saham yang dibeli investor tidak akan pernah turun di pasar',
      },
      {
        key: 'C',
        label: 'Menghapus kewajiban pembayaran bagi investor yang membeli saham',
      },
    ],
    correctOption: 'A',
    correctFeedback:
      'Benar! Netting menyederhanakan ribuan transaksi menjadi selisih bersih yang efisien, sementara penjaminan CCP memitigasi risiko gagal bayar/gagal serah antar pihak.',
    incorrectFeedback:
      'Kurang tepat. KPEI menjamin kepastian penyelesaian transaksi (serah efek & bayar dana), bukan menjamin kenaikan atau penurunan harga pasar saham.',
  },
  {
    id: 'kpei-q3',
    stepNumber: 3,
    topicBadge: 'SIKLUS PENYELESAIAN TRANSAKSI',
    question:
      'Di pasar modal Indonesia, kapan penyelesaian akhir (settlement) perpindahan efek dan dana di pasar reguler umumnya diselesaikan setelah transaksi terjadi (T+0)?',
    options: [
      {
        key: 'A',
        label: 'T+30 (tiga puluh hari bursa setelah transaksi)',
      },
      {
        key: 'B',
        label: 'T+2 (dua hari bursa setelah transaksi terjadi)',
      },
      {
        key: 'C',
        label: 'Hanya diselesaikan setiap akhir tahun kalender',
      },
    ],
    correctOption: 'B',
    correctFeedback:
      'Tepat sekali! Siklus penyelesaian transaksi pasar reguler di Indonesia adalah T+2 (dua hari bursa setelah transaksi dilaksanakan).',
    incorrectFeedback:
      'Belum tepat. Penyelesaian transaksi (settlement) pasar reguler di Bursa Efek Indonesia berlangsung pada T+2, yaitu dua hari bursa setelah hari transaksi.',
  },
];

export function evaluateKpeiMission(
  answers: Array<RiskAnswerOption | null>
): KpeiMissionResult {
  const totalQuestions = KPEI_QUIZ_QUESTIONS.length;
  let correctCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const q = KPEI_QUIZ_QUESTIONS[i];
    if (answers[i] && answers[i] === q.correctOption) {
      correctCount += 1;
    }
  }

  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  let badgeTitle: KpeiMissionResult['badgeTitle'] = 'Pemula Kliring';
  let summaryMessage =
    'Kamu sudah mulai mengenal peran KPEI di balik layar transaksi saham. Pelajari kembali alur kliring T+0 hingga T+2 dan coba ulangi kuisnya!';

  if (correctCount === totalQuestions) {
    badgeTitle = 'Master Kliring & Penjaminan';
    summaryMessage =
      'Luar biasa! Kamu memahami dengan sangat baik bagaimana KPEI melakukan kliring secara netting, menjamin penyelesaian transaksi sebagai CCP, dan menjaga keamanan siklus T+2.';
  } else if (correctCount >= 2) {
    badgeTitle = 'Penjelajah Kliring';
    summaryMessage =
      'Bagus! Kamu sudah memahami fungsi utama kliring dan penjaminan KPEI. Ulangi kuis kapan saja untuk meraih skor sempurna.';
  }

  return {
    correctCount,
    totalQuestions,
    scorePercent,
    badgeTitle,
    summaryMessage,
    keyTakeaways: [
      'KPEI adalah SRO yang menyelenggarakan kliring dan penjaminan penyelesaian transaksi bursa.',
      'Proses Netting menyederhanakan seluruh transaksi menjadi hak dan kewajiban bersih yang efisien.',
      'Sebagai Central Counterparty (CCP), KPEI memitigasi risiko gagal serah efek maupun gagal bayar dana.',
      'Siklus penyelesaian transaksi reguler berlangsung pada T+2 bekerja sama dengan BEI dan KSEI.',
    ],
  };
}
