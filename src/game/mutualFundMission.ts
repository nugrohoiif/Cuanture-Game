import type { RiskAnswerOption } from './market';

export type MutualFundStage = 'intro' | 'types' | 'quiz' | 'result';

export interface MutualFundConceptCard {
  id: 'pengertian' | 'manajer-investasi' | 'bank-kustodian' | 'risiko-fluktuasi';
  badge: string;
  title: string;
  description: string;
  highlight: string;
  accentColor: string;
}

export type MutualFundTypeId =
  | 'pasar-uang'
  | 'pendapatan-tetap'
  | 'campuran'
  | 'saham';

export interface MutualFundTypeCard {
  id: MutualFundTypeId;
  name: string;
  shortTag: string;
  riskLevel: 'Rendah' | 'Rendah – Menengah' | 'Menengah – Tinggi' | 'Tinggi';
  timeHorizon: string;
  allocationRule: string;
  description: string;
  suitableFor: string;
  accentHex: string;
}

export interface MutualFundQuizOption {
  key: RiskAnswerOption;
  label: string;
}

export interface MutualFundQuizQuestion {
  id: string;
  stepNumber: number;
  topicBadge: string;
  question: string;
  options: [MutualFundQuizOption, MutualFundQuizOption, MutualFundQuizOption];
  correctOption: RiskAnswerOption;
  correctFeedback: string;
  incorrectFeedback: string;
}

export interface MutualFundMissionResult {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  badgeTitle: 'Pemula Reksa Dana' | 'Penjelajah Reksa Dana' | 'Master Reksa Dana';
  summaryMessage: string;
  keyTakeaways: string[];
}

export const MUTUAL_FUND_MISSION_TITLE = 'Misi Mengenal Reksa Dana';

export const MUTUAL_FUND_CONCEPTS: MutualFundConceptCard[] = [
  {
    id: 'pengertian',
    badge: 'KONSEP 1 · DEFINISI',
    title: 'Apa Itu Reksa Dana?',
    description:
      'Wadah yang menghimpun dana dari masyarakat pemodal untuk diinvestasikan ke dalam portofolio efek (pasar uang, obligasi, atau saham).',
    highlight: 'Modal terjangkau & langsung terdiversifikasi dalam berbagai aset.',
    accentColor: '#22c55e',
  },
  {
    id: 'manajer-investasi',
    badge: 'KONSEP 2 · PENGELOLA',
    title: 'Peran Manajer Investasi',
    description:
      'Pihak profesional yang mengelola portofolio reksa dana, menganalisis pasar, dan memilih aset sesuai kebijakan investasi.',
    highlight: 'Dikelola oleh profesional berizin dan diawasi OJK.',
    accentColor: '#38bdf8',
  },
  {
    id: 'bank-kustodian',
    badge: 'KONSEP 3 · PENYIMPANAN & ADMINISTRASI',
    title: 'Peran Bank Kustodian',
    description:
      'Menyelenggarakan administrasi, pencatatan unit penyertaan, dan penyimpanan aset reksa dana secara terpisah sesuai ketentuan yang berlaku.',
    highlight: 'Aset investor disimpan aman terpisah dari kekayaan Manajer Investasi.',
    accentColor: '#f59e0b',
  },
  {
    id: 'risiko-fluktuasi',
    badge: 'KONSEP 4 · RISIKO & NILAI',
    title: 'Risiko & Pergerakan Nilai',
    description:
      'Reksa dana memiliki risiko investasi. Nilai Aktiva Bersih per Unit (NAB/UP) dapat naik atau turun mengikuti kinerja aset di dalamnya.',
    highlight: 'Nilai tidak dijamin tetap; sesuaikan jenis reksa dana dengan tujuanmu.',
    accentColor: '#f43f5e',
  },
];

export const MUTUAL_FUND_TYPES: MutualFundTypeCard[] = [
  {
    id: 'pasar-uang',
    name: 'Reksa Dana Pasar Uang',
    shortTag: 'Pasar Uang',
    riskLevel: 'Rendah',
    timeHorizon: '< 1 Tahun (Jangka Pendek)',
    allocationRule: '100% instrumen pasar uang & utang jangka pendek (< 1 tahun)',
    description:
      'Berinvestasi pada instrumen pasar uang dan instrumen utang berjangka pendek sesuai ketentuan.',
    suitableFor:
      'Pemula, dana darurat, atau tujuan keuangan kurang dari 1 tahun dengan fluktuasi paling rendah.',
    accentHex: '#38bdf8',
  },
  {
    id: 'pendapatan-tetap',
    name: 'Reksa Dana Pendapatan Tetap',
    shortTag: 'Pendapatan Tetap',
    riskLevel: 'Rendah – Menengah',
    timeHorizon: '1 – 3 Tahun (Jangka Menengah)',
    allocationRule: 'Minimal 80% pada efek bersifat utang (Obligasi)',
    description:
      'Berinvestasi mayoritas pada surat utang (obligasi pemerintah maupun korporasi) yang memberikan potensi imbal hasil berkala.',
    suitableFor:
      'Investor yang menginginkan pertumbuhan lebih stabil dibanding saham untuk tujuan 1 hingga 3 tahun.',
    accentHex: '#22c55e',
  },
  {
    id: 'campuran',
    name: 'Reksa Dana Campuran',
    shortTag: 'Campuran',
    riskLevel: 'Menengah – Tinggi',
    timeHorizon: '3 – 5 Tahun (Menengah – Panjang)',
    allocationRule: 'Kombinasi pasar uang, obligasi, dan saham (maks. 79% per jenis)',
    description:
      'Berinvestasi pada kombinasi instrumen pasar uang, efek utang, dan efek ekuitas (saham) secara fleksibel sesuai ketentuan.',
    suitableFor:
      'Investor moderat yang mencari keseimbangan antara pertumbuhan aset dan peredam fluktuasi.',
    accentHex: '#f59e0b',
  },
  {
    id: 'saham',
    name: 'Reksa Dana Saham',
    shortTag: 'Saham',
    riskLevel: 'Tinggi',
    timeHorizon: '> 5 Tahun (Jangka Panjang)',
    allocationRule: 'Minimal 80% pada efek bersifat ekuitas (Saham)',
    description:
      'Berinvestasi mayoritas pada portofolio saham perusahaan untuk mengejar potensi pertumbuhan nilai jangka panjang.',
    suitableFor:
      'Investor agresif berorientasi jangka panjang yang siap menghadapi fluktuasi naik-turun harga pasar.',
    accentHex: '#a855f7',
  },
];

export const MUTUAL_FUND_QUIZ_QUESTIONS: MutualFundQuizQuestion[] = [
  {
    id: 'mf-q1',
    stepNumber: 1,
    topicBadge: 'PERAN LEMBAGA REKSA DANA',
    question:
      'Dalam pengelolaan reksa dana, siapakah pihak yang bertugas menyimpan aset reksa dana secara terpisah serta mengurus administrasinya sesuai ketentuan yang berlaku?',
    options: [
      { key: 'A', label: 'Manajer Investasi' },
      { key: 'B', label: 'Bank Kustodian' },
      { key: 'C', label: 'Perusahaan Emiten' },
    ],
    correctOption: 'B',
    correctFeedback:
      'Tepat! Bank Kustodian bertugas menyimpan aset reksa dana secara terpisah dari harta Manajer Investasi serta menyelenggarakan administrasi sesuai ketentuan yang berlaku.',
    incorrectFeedback:
      'Belum tepat. Manajer Investasi bertugas mengelola portofolio investasi, sedangkan penyimpanan aset dan administrasi reksa dana dilakukan oleh Bank Kustodian.',
  },
  {
    id: 'mf-q2',
    stepNumber: 2,
    topicBadge: 'JENIS REKSA DANA',
    question:
      'Rina ingin menyiapkan dana untuk kebutuhan 8 bulan lagi dan mengutamakan fluktuasi nilai yang paling rendah. Jenis reksa dana apa yang paling sesuai?',
    options: [
      { key: 'A', label: 'Reksa Dana Pasar Uang' },
      { key: 'B', label: 'Reksa Dana Campuran' },
      { key: 'C', label: 'Reksa Dana Saham' },
    ],
    correctOption: 'A',
    correctFeedback:
      'Benar! Reksa Dana Pasar Uang berinvestasi pada instrumen pasar uang dan utang berjangka pendek sesuai ketentuan, sehingga risikonya paling rendah untuk horizon < 1 tahun.',
    incorrectFeedback:
      'Kurang tepat. Untuk jangka pendek (< 1 tahun) dengan risiko fluktuasi paling rendah, pilihan yang sesuai adalah Reksa Dana Pasar Uang.',
  },
  {
    id: 'mf-q3',
    stepNumber: 3,
    topicBadge: 'RISIKO & KARAKTERISTIK',
    question:
      'Manakah pernyataan yang paling tepat mengenai risiko dan nilai investasi pada Reksa Dana?',
    options: [
      {
        key: 'A',
        label: 'Nilai reksa dana selalu naik setiap hari dan bebas dari risiko penurunan',
      },
      {
        key: 'B',
        label: 'Reksa dana memiliki risiko dan nilainya dapat naik atau turun mengikuti aset portofolionya',
      },
      {
        key: 'C',
        label: 'Semua jenis reksa dana memiliki tingkat risiko dan potensi hasil yang sama persis',
      },
    ],
    correctOption: 'B',
    correctFeedback:
      'Tepat sekali! Reksa dana tetap memiliki risiko pasar dan nilainya (NAB/Unit) dapat naik atau turun sesuai pergerakan harga aset di dalam portofolionya.',
    incorrectFeedback:
      'Belum tepat. Reksa dana bukan tabungan bebas risiko; nilainya dapat naik atau turun tergantung pada kinerja instrumen investasi di dalam portofolio.',
  },
];

export function evaluateMutualFundMission(
  answers: Array<RiskAnswerOption | null>
): MutualFundMissionResult {
  const totalQuestions = MUTUAL_FUND_QUIZ_QUESTIONS.length;
  let correctCount = 0;

  for (let i = 0; i < totalQuestions; i++) {
    const q = MUTUAL_FUND_QUIZ_QUESTIONS[i];
    if (answers[i] && answers[i] === q.correctOption) {
      correctCount += 1;
    }
  }

  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  let badgeTitle: MutualFundMissionResult['badgeTitle'] = 'Pemula Reksa Dana';
  let summaryMessage =
    'Kamu sudah mengenal dasar-dasar reksa dana. Coba baca kembali kartu materi dan ulangi kuis untuk memperkuat pemahamanmu!';

  if (correctCount === totalQuestions) {
    badgeTitle = 'Master Reksa Dana';
    summaryMessage =
      'Luar biasa! Kamu memahami cara kerja reksa dana, pemisahan peran Manajer Investasi dan Bank Kustodian, serta cara memilih jenis reksa dana sesuai profil risiko.';
  } else if (correctCount >= 2) {
    badgeTitle = 'Penjelajah Reksa Dana';
    summaryMessage =
      'Bagus! Kamu sudah memahami sebagian besar konsep penting reksa dana. Kamu bisa mengulangi kuis kapan saja untuk meraih skor sempurna.';
  }

  return {
    correctCount,
    totalQuestions,
    scorePercent,
    badgeTitle,
    summaryMessage,
    keyTakeaways: [
      'Reksa dana menghimpun dana investor untuk dikelola profesional oleh Manajer Investasi.',
      'Bank Kustodian menyimpan aset secara terpisah dan mengurus administrasi sesuai ketentuan.',
      'Ada 4 jenis utama: Pasar Uang, Pendapatan Tetap, Campuran, dan Saham.',
      'Nilai reksa dana dapat naik atau turun; pilih sesuai tujuan dan profil risikomu.',
    ],
  };
}

export function getRecommendedMutualFundForProfile(
  profileLabel?: 'Konservatif' | 'Moderat' | 'Agresif' | null
): {
  fundName: string;
  reason: string;
} {
  if (profileLabel === 'Konservatif') {
    return {
      fundName: 'Reksa Dana Pasar Uang & Pendapatan Tetap',
      reason:
        'Sesuai profil Konservatifmu yang mengutamakan stabilitas nilai dan fluktuasi rendah.',
    };
  }
  if (profileLabel === 'Moderat') {
    return {
      fundName: 'Reksa Dana Pendapatan Tetap & Campuran',
      reason:
        'Sesuai profil Moderatmu yang mencari keseimbangan antara pertumbuhan di atas inflasi dan risiko terukur.',
    };
  }
  if (profileLabel === 'Agresif') {
    return {
      fundName: 'Reksa Dana Saham & Campuran',
      reason:
        'Sesuai profil Agresifmu yang berorientasi pada pertumbuhan jangka panjang dan siap menghadapi volatilitas pasar.',
    };
  }
  return {
    fundName: 'Sesuaikan dengan Tujuan & Profil Risikomu',
    reason:
      'Tips: Kunjungi Kios Konsultan Keuangan di dekat Arrival Plaza untuk mengikuti Tes Profil Risiko!',
  };
}
