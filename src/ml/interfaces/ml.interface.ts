

export interface MlAnalysisResult {
    nama_makanan: string;
    komponen_menu: Array<{
        nama:string;
        porsi:string;
    }>
    kandungan_gizi: {
        kalori_total: number;
        karbohidrat: number;
        protein: number;
        lemak: number;
        gula: number;
        serat: number;
        sodium: number;
    }
    deteksi_risiko: {
        alergi: string[];
        tekstur: string[];
        porsi_gizi: string[];
    }

    rekomendasi: string;
    confidence: number;
}

