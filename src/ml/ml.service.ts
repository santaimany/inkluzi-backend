/*
https://docs.nestjs.com/providers#services
*/

import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MlAnalysisResult } from './interfaces/ml.interface';
import axios from 'axios';

@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly mlApiUrl: string;

  constructor(private readonly config: ConfigService) {
    this.mlApiUrl =
      this.config.get<string>('ML_API_URL') || 'http://localhost:5000';
    this.logger.log(`ML API URL: ${this.mlApiUrl}`);
  }

  async analyzeFoodImage(
    imageUrl: string,
    disabilityTypes: Array<{
      jenisDisabilitas: string;
      jumlahSiswa: number;
    }>,
  ){
    try {
      this.logger.log(`Sending image to ML API for analysis: ${imageUrl}`);
      const response = await axios.post<MlAnalysisResult>(
        `${this.mlApiUrl}/analyzwe`,
        {
          image_url: imageUrl,
          disability_types: disabilityTypes,
        },
        {
          timeout: 20000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(
        `Received response from ML API: ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      this.logger.error(`Error communicating with ML API: ${error.message}`);

      if (axios.isAxiosError(error) && error.response) {
        if (error.code === 'ECONNREFUSED') {
          throw new HttpException(
            'Gagal terhubung ke layanan ML. Silakan coba lagi nanti.',
            503,
          );
        }
        if (error.response) {
          throw new HttpException(
            `ML service tidak tersdia. Silahkan coba lagi nanti. (${error.response.status})`,
            error.response.status,
          );
        }
      }
      throw new HttpException('Gagal menganalisis gambar makanan', 500);
    }
  }
}
