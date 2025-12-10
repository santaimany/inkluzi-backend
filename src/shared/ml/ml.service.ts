import { Injectable, Logger, HttpException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { MenuAnalysisResult, MlAnalysisResult } from './interfaces/ml.interface';
import { KomponenMenuDto } from 'src/modules/menus/sppg-menus/dto/create-menu.dto';

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('GOOGLE_API_KEY not found. ML service will not work.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash' 
    });
    
    this.logger.log('Gemini AI initialized successfully');
  }

  /**
   * Convert image URL to base64 for Gemini
   */
  private async fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      return Buffer.from(response.data).toString('base64');
    } catch (error) {
      throw new HttpException(
        'Gagal mengunduh gambar dari Cloudinary',
        500,
      );
    }
  }

  /**
   * Analyze food image using Gemini AI
   */
  async analyzeFoodImage(
    imageUrl: string,
    disabilityTypes: Array<{
      jenisDisabilitas: string;
      jumlahSiswa: number;
    }>,
  ): Promise<MlAnalysisResult> {
    try {
      this.logger.log(`Starting Gemini analysis for: ${imageUrl}`);

      const disabilityContext = disabilityTypes
        .map(
          (dt) =>
            `- ${dt.jenisDisabilitas}: ${dt.jumlahSiswa} siswa`,
        )
        .join('\n');

    
const prompt = `
Analisis gambar makanan ini dan berikan hasil dalam format JSON.

Konteks: Ini adalah makanan untuk sekolah inklusi dengan siswa disabilitas:
${JSON.stringify(disabilityTypes, null, 2)}

STANDAR AKG (Angka Kecukupan Gizi) per hari:
- Kalori: 2000 kkal
- Karbohidrat: 300 g
- Protein: 66 g
- Lemak: 65 g
- Serat: 30 g
- Sodium: 2300 mg

Tugas:
1. Identifikasi nama makanan secara keseluruhan
2. Deteksi komponen menu individual dengan estimasi porsi (gram/ml/buah)
3. Hitung kandungan gizi total per porsi
4. Deteksi risiko kesehatan - kategorikan risiko yang BENAR-BENAR terdeteksi:
   
   Kategori risiko yang mungkin:
   - "alergi": risiko alergen (susu, telur, kacang, gluten, seafood, dll)
   - "tekstur": masalah tekstur untuk disabilitas (keras, kenyal, sulit dikunyah)
   - "nutrisi": kandungan gizi berlebih/kurang (sodium tinggi, gula tinggi, kalori berlebih, protein kurang)
   - "keamanan": risiko keamanan pangan (mentah, tidak higienis, kadaluarsa)
   - "pencernaan": risiko masalah pencernaan (pedas, asam, berminyak, bersantan kental)
   - "porsi": masalah ukuran porsi (terlalu besar/kecil untuk anak)
   
   Isi kategori HANYA jika ada risiko. Kategori yang tidak ada risiko JANGAN dimasukkan.
   
5. Rekomendasi: berikan 1 kalimat singkat saja, atau null jika tidak ada masalah

Format output JSON (HARUS STRICT):
{
  "nama_makanan": "Nama lengkap makanan",
  "komponen_menu": [
    {"nama": "Komponen 1", "porsi": "150 g"},
    {"nama": "Komponen 2", "porsi": "40 g"}
  ],
  "kandungan_gizi": {
    "kalori_total": 500,
    "karbohidrat": 82,
    "protein": 14,
    "lemak": 12,
    "gula": 19,
    "serat": 3.8,
    "sodium": 520
  },
  "deteksi_risiko": {
    "nutrisi": ["Sodium tinggi 1200mg per porsi (52% AKG harian)", "Gula 28g melebihi batas harian anak"],
    "tekstur": ["Kerupuk keras tidak cocok untuk siswa dengan kesulitan mengunyah"],
    "alergi": ["Mengandung susu yang berisiko untuk siswa intoleransi laktosa"]
  },
  "rekomendasi": "Kurangi garam dan ganti kerupuk dengan sayuran rebus",
  "confidence": 85
}

PENTING:
- confidence dalam skala 0-100 (integer)
- deteksi_risiko adalah OBJECT dengan key dinamis (hanya kategori yang ada risiko)
- Jika tidak ada risiko sama sekali, deteksi_risiko = {}
- Setiap kategori berisi array of string
- Rekomendasi maksimal 1 kalimat singkat atau null
- Berikan HANYA JSON, tanpa markdown atau teks tambahan
`;

  
      const imageBase64 = await this.fetchImageAsBase64(imageUrl);

 
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          },
        },
      ]);

      const response = await result.response;
      let responseText = response.text().trim();

      this.logger.log('Received response from Gemini');

      
      if (responseText.startsWith('```json')) {
        responseText = responseText.slice(7);
      } else if (responseText.startsWith('```')) {
        responseText = responseText.slice(3);
      }
      
      if (responseText.endsWith('```')) {
        responseText = responseText.slice(0, -3);
      }
      
      responseText = responseText.trim();


      const analysisResult: MlAnalysisResult = JSON.parse(responseText);


      if (analysisResult.confidence < 0.5) {
        throw new HttpException(
          'Gambar tidak cukup jelas untuk dianalisis. Silakan upload gambar yang lebih jelas.',
          400,
        );
      }

      this.logger.log(
        `Analysis completed with confidence: ${analysisResult.confidence}`,
      );

      return analysisResult;
      
    } catch (error) {
      this.logger.error(`Gemini analysis failed: ${error.message}`);

      if (error instanceof HttpException) {
        throw error;
      }

      if (error.message?.includes('JSON')) {
        throw new HttpException(
          'Gagal memproses hasil analisis. Silakan coba lagi.',
          500,
        );
      }

      throw new HttpException(
        'Gagal menganalisis gambar makanan. Silakan coba lagi.',
        500,
      );
    }
  }


async analyzeMenu(
  menuName: string,
  components: Array<{ nama: string; porsi: string }>,
  disabilityTypes: string[]
): Promise<MenuAnalysisResult> {
  try {
    this.logger.log('Starting menu analysis with Gemini AI');


    const componentsList = components
      .map(c => `- ${c.nama}: ${c.porsi}`)
      .join('\n');

  
    const prompt = `Kamu adalah ahli nutrisi dan keamanan pangan untuk anak-anak dengan disabilitas.

**DATA MENU:**
Nama Menu: ${menuName}

**KOMPONEN MAKANAN:**
${componentsList}

**TIPE DISABILITAS ANAK:**
${disabilityTypes.length > 0 ? disabilityTypes.join(', ') : 'Tidak ada data spesifik'}

**STANDAR ANGKA KECUKUPAN GIZI (AKG) ANAK USIA 7-12 TAHUN:**
- Energi: 2000 kkal/hari (untuk 1 kali makan ±500-800 kkal)
- Karbohidrat: 300g/hari
- Protein: 66g/hari (minimal 15g per makan)
- Lemak: 65g/hari
- Serat: 30g/hari (minimal 5g per makan)
- Gula: max 50g/hari (max 15g per makan)
- Natrium: max 2300mg/hari (max 900mg per makan)

**INSTRUKSI ANALISIS:**

1. **HITUNG KANDUNGAN GIZI** total dari semua komponen:
   - Kalori total (kkal)
   - Karbohidrat (gram)
   - Protein (gram)
   - Lemak (gram)
   - Gula (gram)
   - Serat (gram)
   - Sodium (mg)

2. **EVALUASI PARAMETER DENGAN SISTEM SCORING:**

   Berikan poin untuk setiap parameter berikut:
   
   a. **KALORI** (per porsi):
      - 500-800 kkal → +1 poin (AMAN)
      - 400-499 atau 801-900 kkal → 0 poin (WARNING)
      - <400 atau >950 kkal → -2 poin (MERAH)
   
   b. **PROTEIN** (per porsi):
      - ≥15g → +1 poin (AMAN)
      - 10-14g → 0 poin (WARNING)
      - <10g → -2 poin (MERAH)
   
   c. **SODIUM** (per porsi):
      - <900mg → +1 poin (AMAN)
      - 900-1200mg → 0 poin (WARNING)
      - >1300mg → -2 poin (MERAH)
   
   d. **GULA** (per porsi):
      - <15g → +1 poin (AMAN, gula dari buah segar tidak dihitung)
      - 15-20g → 0 poin (WARNING)
      - >25g → -2 poin (MERAH)
   
   e. **LEMAK** (per porsi):
      - 10-25g → +1 poin (AMAN)
      - 25-35g → 0 poin (WARNING)
      - >40g atau <5g → -2 poin (MERAH)
   
   f. **SERAT** (per porsi):
      - ≥5g → +1 poin (AMAN)
      - 3-4g → 0 poin (WARNING)
      - <3g → -2 poin (MERAH)
   
   g. **TEKSTUR** (untuk disabilitas):
      - Semua komponen empuk/mudah dikunyah → +1 poin (AMAN)
      - Ada komponen agak keras tapi masih OK → 0 poin (WARNING)
      - Ada komponen sangat keras/berisiko tersedak → -2 poin (MERAH)
   
   h. **ALERGEN**:
      - Tidak ada alergen umum → +1 poin (AMAN)
      - Ada alergen tapi umum dan terkontrol (misal: ikan, telur) → 0 poin (WARNING)
      - Ada alergen tinggi/multipel (seafood+kacang+susu) → -2 poin (MERAH)

3. **TENTUKAN STATUS BERDASARKAN TOTAL POIN:**
   - **≥6 poin** → status: "aman"
   - **2 hingga 5 poin** → status: "perlu_perhatian"
   - **≤1 poin** → status: "tidak_aman"

4. **DETEKSI RISIKO** - Catat hanya parameter yang bernilai WARNING (0 poin) atau MERAH (-2 poin):
   
   Jika ada masalah, kelompokkan dalam 3 kategori:
   
   a. **alergi**: Bahan yang berpotensi alergi (hanya jika skor alergen ≤0)
      - Contoh: "Mengandung ikan, perlu perhatian untuk siswa alergi seafood."
   
   b. **tekstur**: Evaluasi tekstur (hanya jika skor tekstur ≤0)
      - Contoh: "Tumis buncis agak keras, perhatikan untuk siswa dengan masalah mengunyah."
   
   c. **porsi_gizi**: Masalah nutrisi signifikan (hanya parameter dengan skor ≤0)
      - Contoh: "Sodium tinggi (1200mg), melebihi standar per makan."
      - Atau: "Protein rendah (8g), kurang dari kebutuhan minimal."

   **PENTING**: Jika SEMUA parameter mendapat +1 (total poin = 8), maka deteksi_risiko = {}

5. **REKOMENDASI:**
   - Jika total poin ≥6: "Tidak memerlukan tindakan khusus, menu aman untuk semua kelompok siswa."
   - Jika total poin 2-5: Berikan saran perbaikan 1-2 kalimat untuk parameter WARNING/MERAH
   - Jika total poin ≤1: Berikan rekomendasi tegas untuk perbaikan/penggantian menu

6. **CONFIDENCE SCORE:**
   - 90-100: Data komponen lengkap dan jelas
   - 75-89: Data cukup lengkap, beberapa estimasi
   - 60-74: Banyak estimasi, perlu verifikasi

**CONTOH EVALUASI:**

Menu A: Nasi 150g + Ayam Goreng 80g + Tumis Sayur 100g + Pisang 1 buah
Estimasi: Kalori 650, Protein 28g, Sodium 680mg, Gula 12g (dari pisang), Lemak 18g, Serat 7g
Skor: Kalori +1, Protein +1, Sodium +1, Gula +1, Lemak +1, Serat +1, Tekstur +1, Alergen +1 = **8 poin → AMAN**

Menu B: Nasi 200g + Ikan Asin 100g + Kerupuk 50g + Teh Manis 200ml
Estimasi: Kalori 720, Protein 32g, Sodium 1400mg, Gula 18g, Lemak 15g, Serat 3g
Skor: Kalori +1, Protein +1, Sodium -2 (1400mg), Gula 0 (18g), Lemak +1, Serat 0 (3g), Tekstur 0 (kerupuk keras), Alergen 0 (ikan) = **1 poin → TIDAK AMAN**

Menu C: Nasi 120g + Tempe Goreng 60g + Sayur Asem 150g + Jeruk 1 buah
Estimasi: Kalori 480, Protein 16g, Sodium 850mg, Gula 10g, Lemak 12g, Serat 8g
Skor: Kalori 0 (480 kkal), Protein +1, Sodium +1, Gula +1, Lemak +1, Serat +1, Tekstur +1, Alergen +1 = **7 poin → AMAN**

Menu D: Mie Instan + Sosis + Minuman Bersoda
Estimasi: Kalori 820, Protein 12g, Sodium 1800mg, Gula 35g, Lemak 28g, Serat 2g
Skor: Kalori 0 (820), Protein 0 (12g), Sodium -2 (1800mg), Gula -2 (35g), Lemak 0 (28g), Serat -2 (2g), Tekstur +1, Alergen +1 = **-6 poin → TIDAK AMAN**

**FORMAT OUTPUT (WAJIB JSON VALID):**
{
  "deteksi_risiko": {
    "porsi_gizi": ["Sodium tinggi (1400mg), melebihi standar per makan.", "Serat rendah (3g), kurang dari target minimal."],
    "tekstur": ["Kerupuk keras, berisiko untuk siswa dengan kesulitan mengunyah."],
    "alergi": ["Mengandung ikan asin, perhatikan untuk siswa alergi seafood."]
  },
  "kandungan_gizi": {
    "kalori_total": 720,
    "karbohidrat": 98,
    "protein": 32,
    "lemak": 15,
    "gula": 18,
    "serat": 3,
    "sodium": 1400
  },
  "rekomendasi": "Ganti ikan asin dengan ikan segar untuk menurunkan sodium. Tambahkan 100g sayuran hijau untuk meningkatkan serat. Hindari kerupuk untuk siswa sensitif tekstur.",
  "status_aman": "tidak_aman",
  "confidence": 88
}

ATAU jika menu sangat baik (8 poin):

{
  "deteksi_risiko": {},
  "kandungan_gizi": {
    "kalori_total": 650,
    "karbohidrat": 85,
    "protein": 28,
    "lemak": 18,
    "gula": 12,
    "serat": 7,
    "sodium": 680
  },
  "rekomendasi": "Tidak memerlukan tindakan khusus, menu aman untuk semua kelompok siswa.",
  "status_aman": "aman",
  "confidence": 95
}

Analisis dengan sistem scoring yang objektif. Pastikan output adalah JSON valid.

PENTING:
- Hitung poin SEMUA 8 parameter (kalori, protein, sodium, gula, lemak, serat, tekstur, alergen)
- Total poin menentukan status: ≥6 = aman, 2-5 = perlu_perhatian, ≤1 = tidak_aman
- deteksi_risiko hanya berisi kategori dengan parameter WARNING/MERAH (skor ≤0)
- Gula dari buah segar (pisang, jeruk, apel) tidak dihitung sebagai masalah
- 1-2 parameter WARNING tidak membuat menu "tidak_aman"
- confidence dalam skala 0-100 (integer)
- Berikan HANYA JSON, tanpa markdown atau teks tambahan`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();


    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();


    const analysisData: MenuAnalysisResult = JSON.parse(text);

    this.logger.log(`Menu analysis completed with confidence: ${analysisData.confidence}`);
    return analysisData;

  } catch (error) {
    this.logger.error('Error analyzing menu with Gemini AI', error);
    throw new BadRequestException(
      'Gagal menganalisis menu. Silakan coba lagi.'
    );
  }
}

async generateNutritionDetail(data: {
  nama_menu: string;
  komponen_menu: any[];
  basic_nutrition?: any; 
}): Promise<any> {
  
  const komponenList = Array.isArray(data.komponen_menu)
    ? data.komponen_menu
        .map((k) => 
          typeof k === 'object' 
            ? `${k.nama} (${k.porsi || 'porsi standar'})`
            : k
        )
        .join(', ')
    : data.komponen_menu;


  const nutritionReference = data.basic_nutrition
    ? `
GUNAKAN DATA NUTRISI BASIC INI SEBAGAI REFERENSI (jangan ubah nilai total):
- Total Kalori: ${data.basic_nutrition.kalori_total || data.basic_nutrition.total_kalori} kkal
- Protein: ${data.basic_nutrition.protein} g
- Karbohidrat: ${data.basic_nutrition.karbohidrat} g
- Lemak: ${data.basic_nutrition.lemak} g
- Serat: ${data.basic_nutrition.serat} g
- Gula: ${data.basic_nutrition.gula} g
- Sodium: ${data.basic_nutrition.sodium} mg

PENTING: Total kalori di response HARUS sama dengan ${data.basic_nutrition.kalori_total || data.basic_nutrition.total_kalori} kkal!
    `
    : '';

  const prompt = `
Kamu adalah ahli gizi yang akan menganalisis menu makanan sekolah untuk anak berkebutuhan khusus.

Menu: ${data.nama_menu}
Komponen: ${komponenList}

${nutritionReference}

Berikan analisis nutrisi LENGKAP dalam format JSON dengan struktur PERSIS seperti ini (gunakan snake_case):

{
  "deskripsi": "(3-4 kalimat) Deskripsi lengkap menu, cara memasak, tekstur makanan, dan manfaat nutrisinya untuk siswa berkebutuhan khusus",
  "info_nutrisi": {
    "total_kalori": ${data.basic_nutrition?.kalori_total || data.basic_nutrition?.total_kalori || '(hitung total kalori)'},
    "total_porsi": "(hitung total) gram/porsi",
    "donut_chart": {
      "karbohidrat": {
        "persentase": (hitung: (${data.basic_nutrition?.karbohidrat || 'X'} × 4) / total_kalori × 100),
        "label": "Karbohidrat\\n(number)%"
      },
      "protein": {
        "persentase": (hitung: (${data.basic_nutrition?.protein || 'X'} × 4) / total_kalori × 100),
        "label": "Protein\\n(number)%"
      },
      "lemak": {
        "persentase": (hitung: (${data.basic_nutrition?.lemak || 'X'} × 9) / total_kalori × 100),
        "label": "Lemak\\n(number)%"
      },
      "lainnya": {
        "persentase": (100 - karbohidrat% - protein% - lemak%),
        "label": "Lainnya\\n(number)%"
      }
    }
  },
  "persentase_akg": {
    "kalori": { 
      "label": "Kalori", 
      "nilai": "${data.basic_nutrition?.kalori_total ? Math.round((data.basic_nutrition.kalori_total / 2000) * 100) : '(hitung)'}% Nilai Harian" 
    },
    "karbohidrat": { 
      "label": "Karbohidrat", 
      "nilai": "${data.basic_nutrition?.karbohidrat ? Math.round((data.basic_nutrition.karbohidrat / 300) * 100) : '(hitung)'}% Nilai Harian" 
    },
    "protein": { 
      "label": "Protein", 
      "nilai": "${data.basic_nutrition?.protein ? Math.round((data.basic_nutrition.protein / 66) * 100) : '(hitung)'}% Nilai Harian" 
    },
    "lemak": { 
      "label": "Lemak", 
      "nilai": "${data.basic_nutrition?.lemak ? Math.round((data.basic_nutrition.lemak / 65) * 100) : '(hitung)'}% Nilai Harian" 
    },
    "serat": { 
      "label": "Serat", 
      "nilai": "${data.basic_nutrition?.serat ? Math.round((data.basic_nutrition.serat / 30) * 100) : '(hitung)'}% Nilai Harian" 
    },
    "gula": { 
      "label": "Gula", 
      "nilai": "${data.basic_nutrition?.gula ? Math.round((data.basic_nutrition.gula / 50) * 100) : '(hitung)'}% Nilai Harian" 
    },
    "sodium": { 
      "label": "Sodium", 
      "nilai": "${data.basic_nutrition?.sodium ? Math.round((data.basic_nutrition.sodium / 2300) * 100) : '(hitung)'}% Nilai Harian" 
    }
  },
  "komponen_detail": [
    {
      "nama": "Nama komponen",
      "berat": "(number) gram atau (number) mili",
      "kalori": (number),
      "satuan_kalori": "kkal Kalori",
      "nutrisi": {
        "karbohidrat": { "nilai": "(number)g", "label": "Karbohidrat" },
        "protein": { "nilai": "(number)g", "label": "Protein" },
        "lemak": { "nilai": "(number)g", "label": "Lemak" },
        "gula": { "nilai": "(number)g", "label": "Gula" },
        "serat": { "nilai": "(number)g", "label": "Serat" },
        "sodium": { "nilai": "(number)mg", "label": "Sodium" }
      }
    }
  ],
  "informasi_akg": {
    "pengertian": "AKG (Angka Kecukupan Gizi) adalah acuan jumlah energi dan zat gizi yang sebaiknya dikonsumsi seseorang setiap hari sesuai usia dan kondisi tubuh.",
    "fungsi": "Persentase AKG menunjukkan seberapa besar kontribusi satu porsi menu terhadap kebutuhan harian. Dengan % AKG, sekolah bisa lebih cepat menilai apakah makanan cukup bergizi, terlalu tinggi gula/lemak, atau kurang aman untuk anak disabilitas yang memerlukan penyesuaian khusus.",
    "tetapan_akg": {
      "energi": "2000 kkal",
      "karbohidrat": "300 g",
      "protein": "66 g",
      "lemak": "65 g",
      "serat": "30 g",
      "sodium": "2300 mg"
    }
  }
}

PENTING:
- PASTIKAN total_kalori di info_nutrisi = ${data.basic_nutrition?.kalori_total || data.basic_nutrition?.total_kalori} (HARUS SAMA!)
- Breakdown komponen_detail harus total = kalori total
- Donut chart persentase harus total = 100%
- Response HARUS valid JSON tanpa markdown
  `;

  try {
    const result = await this.model.generateContent(prompt);
    let responseText = result.response.text()
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsedData = JSON.parse(responseText);
    
    
    if (!parsedData.info_nutrisi || !parsedData.komponen_detail) {
      throw new Error('Invalid nutrition data structure');
    }

    return parsedData;
  } catch (error) {
    console.error('Error generating nutrition detail:', error);
    throw new InternalServerErrorException(
      'Gagal menghasilkan detail nutrisi. Silakan coba lagi.',
    );
  }
}
}
