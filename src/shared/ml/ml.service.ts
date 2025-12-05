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
- Energi: 2000 kkal/hari (untuk 1 kali makan ±600-700 kkal)
- Karbohidrat: 300g/hari
- Protein: 66g/hari
- Lemak: 65g/hari
- Serat: 30g/hari
- Natrium: max 2300mg/hari

**INSTRUKSI ANALISIS:**

1. **HITUNG KANDUNGAN GIZI** total dari semua komponen:
   - Kalori total (kkal)
   - Karbohidrat (gram)
   - Protein (gram)
   - Lemak (gram)
   - Gula (gram)
   - Serat (gram)
   - Sodium (mg)

2. **DETEKSI RISIKO** yang dikelompokkan dalam 3 kategori:
   
   a. **ALERGI:**
      - Identifikasi bahan yang berpotensi menyebabkan alergi
      - Contoh: "Tidak ada bahan dengan potensi alergi tinggi."
      - Atau: "Mengandung seafood, perlu perhatian untuk alergi ikan."
   
   b. **TEKSTUR:**
      - Evaluasi tekstur makanan untuk anak dengan disabilitas
      - Contoh: "Ikan empuk → aman untuk siswa sensitif tekstur."
      - Atau: "Tekstur bervariasi, cocok untuk stimulasi sensorik."
   
   c. **PORSI_GIZI:**
      - Evaluasi kecukupan gizi dibanding AKG
      - Contoh: "Semua porsi gizi berada dalam rentang standar MBG."
      - Atau: "Kalori tinggi (800 kkal), melebihi standar 1 kali makan."
      - Berikan warning jika ada kelebihan/kekurangan signifikan

3. **REKOMENDASI:**
   - Berikan saran perbaikan jika ada risiko (maksimal 2 kalimat)
   - Atau konfirmasi menu sudah sesuai
   - Contoh: "Tidak memerlukan tindakan khusus, menu aman untuk semua kelompok siswa."

4. **STATUS AMAN:**
   - "aman" jika tidak ada risiko signifikan
   - "perlu_perhatian" jika ada risiko yang perlu diperhatikan tapi masih bisa dikonsumsi
   - "tidak_aman" jika ada risiko serius dan sebaiknya tidak dikonsumsi

5. **CONFIDENCE SCORE:**
   - Berikan confidence 0-100 berdasarkan:
     * Kelengkapan data komponen (70-100 jika lengkap)
     * Kejelasan porsi (90-100 jika sangat jelas, 60-80 jika estimasi)
     * Ketersediaan data nutrisi (95-100 jika makanan umum, 70-90 jika makanan khusus)

**FORMAT OUTPUT (WAJIB JSON VALID):**
{
  "deteksi_risiko": {
    "alergi": ["Tidak ada bahan dengan potensi alergi tinggi."],
    "tekstur": ["Ikan empuk → aman untuk siswa sensitif tekstur."],
    "porsi_gizi": ["Semua porsi gizi berada dalam rentang standar MBG."]
  },
  "kandungan_gizi": {
    "kalori_total": 590,
    "karbohidrat": 76,
    "protein": 28,
    "lemak": 14,
    "gula": 10,
    "serat": 7,
    "sodium": 680
  },
  "rekomendasi": "Tidak memerlukan tindakan khusus, menu aman untuk semua kelompok siswa.",
  "status_aman": "aman",
  "confidence": 92
}

ATAU jika ada masalah:

{
  "deteksi_risiko": {
    "alergi": ["Mengandung ikan, hindari untuk siswa dengan alergi seafood."],
    "tekstur": ["Tumis buncis agak keras, perhatikan untuk siswa dengan masalah mengunyah."],
    "porsi_gizi": ["Kalori tinggi (800 kkal), melebihi standar 1 kali makan.", "Sodium tinggi (1200mg), 52% dari AKG harian."]
  },
  "kandungan_gizi": {
    "kalori_total": 800,
    "karbohidrat": 95,
    "protein": 35,
    "lemak": 25,
    "gula": 18,
    "serat": 5,
    "sodium": 1200
  },
  "rekomendasi": "Kurangi porsi nasi 30g dan ganti garam dengan bumbu alami. Tambahkan 50g sayuran hijau untuk meningkatkan serat.",
  "status_aman": "perlu_perhatian",
  "confidence": 88
}

Analisis dengan teliti dan objektif. Pastikan output adalah JSON valid yang bisa di-parse.

PENTING:
- confidence dalam skala 0-100 (integer)
- deteksi_risiko adalah OBJECT dengan key dinamis (hanya kategori yang ada risiko)
- Jika tidak ada risiko sama sekali, deteksi_risiko = {}
- Setiap kategori berisi array of string
- Rekomendasi maksimal 1 kalimat singkat atau null
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
