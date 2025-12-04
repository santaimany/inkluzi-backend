// src/ml/interfaces/ml.interface.ts

export interface KomponenMenu {
  nama: string;
  porsi: string;
}

export interface KandunganGizi {
  kalori_total: number;
  karbohidrat: number;
  protein: number;
  lemak: number;
  gula: number;
  serat: number;
  sodium: number;
}

export interface DeteksiRisiko {
  alergi?: string[];
  tekstur?: string[];
  porsi_gizi?: string[];
  nutrisi?: string[];
  keamanan?: string[];
  pencernaan?: string[];
  porsi?: string[];
  [key: string]: string[] | undefined; // Allow dynamic keys
}

export interface MlAnalysisResult {
  nama_makanan: string;
  komponen_menu: KomponenMenu[];
  kandungan_gizi: KandunganGizi;
  deteksi_risiko: DeteksiRisiko;
  rekomendasi: string | null;
  confidence: number;
}

export interface MenuAnalysisResult {
  deteksi_risiko: {
    alergi: string[];
    tekstur: string[];
    porsi_gizi: string[];
  };
  kandungan_gizi: KandunganGizi;
  rekomendasi: string;
  status_aman: 'aman' | 'perlu_perhatian' | 'tidak_aman';
  confidence: number; // TAMBAHKAN INI
}