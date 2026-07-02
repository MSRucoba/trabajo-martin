import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SunatService {
  private readonly apiKey = 'sk_10733.BSPHz2Qr8wPuRZG5CBqltBMpfc6eCIvf';
  private readonly baseUrl = 'https://api.decolecta.com/api/ruc';

  async consultarRuc(ruc: string) {
    try {
      const response = await axios.get<any>(`${this.baseUrl}/${ruc}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const data: any = response.data;

      const razonSocial =
        data?.data?.razon_social ||
        data?.data?.nombre_o_razon_social ||
        data?.razon_social ||
        data?.nombre_o_razon_social ||
        null;

      return {
        ruc,
        razon_social: razonSocial,
      };
    } catch (error: any) {
      console.error(
        'Error consultando RUC:',
        error.response?.data || error.message,
      );

      throw new HttpException(
        error.response?.data?.message || 'Error consultando RUC',
        error.response?.status || 500,
      );
    }
  }
}
