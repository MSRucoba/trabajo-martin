import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';

interface DecolectaResponse {
  first_name: string;
  first_last_name: string;
  second_last_name: string;
  document_number: string;
}

interface ReniecResponse {
  dni: string;
  nombre: string;
  apellido: string;
}

@Injectable()
export class ReniecService {
  private readonly apiKey = 'sk_10733.BSPHz2Qr8wPuRZG5CBqltBMpfc6eCIvf';
  private readonly baseUrl = 'https://api.decolecta.com/v1/reniec/dni';

  async consultarDni(dni: string): Promise<ReniecResponse> {
    if (!/^\d{8}$/.test(dni)) {
      throw new BadRequestException(
        'El formato del DNI no es válido. Debe contener 8 dígitos',
      );
    }

    try {
      const response = await axios.get<DecolectaResponse>(
        `${this.baseUrl}?numero=${dni}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 10000,
        },
      );

      const data = response.data;

      if (!data?.document_number) {
        throw new HttpException(
          'Respuesta inválida del servicio RENIEC',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return {
        dni: data.document_number,
        nombre: data.first_name || '',
        apellido:
          `${data.first_last_name ?? ''} ${data.second_last_name ?? ''}`.trim(),
      };
    } catch (error: any) {
      if (error.response) {
        const status = error.response?.status || 500;
        const message =
          error.response?.data?.message || 'Error consultando DNI';

        if (status === 404) {
          throw new HttpException(
            `DNI ${dni} no encontrado en RENIEC`,
            HttpStatus.NOT_FOUND,
          );
        }

        if (status === 401 || status === 403) {
          throw new HttpException(
            'Error de autenticación con la API de RENIEC',
            HttpStatus.UNAUTHORIZED,
          );
        }

        if (status === 429) {
          throw new HttpException(
            'Límite de consultas excedido. Intente más tarde',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        throw new HttpException(message, status);
      }

      if (error.code === 'ECONNABORTED') {
        throw new HttpException(
          'Tiempo de espera agotado al consultar DNI',
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      throw new HttpException(
        'Error interno al consultar DNI',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
