import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { MlAnalysisResult } from './interfaces/ml.interface';

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

      // Build context about disability types
      const disabilityContext = disabilityTypes
        .map(
          (dt) =>
            `- ${dt.jenisDisabilitas}: ${dt.jumlahSiswa} siswa`,
        )
        .join('\n');

      // Create detailed prompt
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

      // Download image as base64
      const imageBase64 = await this.fetchImageAsBase64(imageUrl);

      // Send to Gemini
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

      // Clean markdown if present
      if (responseText.startsWith('```json')) {
        responseText = responseText.slice(7);
      } else if (responseText.startsWith('```')) {
        responseText = responseText.slice(3);
      }
      
      if (responseText.endsWith('```')) {
        responseText = responseText.slice(0, -3);
      }
      
      responseText = responseText.trim();

      // Parse JSON
      const analysisResult: MlAnalysisResult = JSON.parse(responseText);

      // Validate confidence score
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
}