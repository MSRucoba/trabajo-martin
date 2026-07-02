import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class CupoVehiculoService {
  private apiUrl = `${environment.apiUrl}/cupo-vehiculo`;
  constructor(private https: HttpClient, private tokenService: TokenService) {}

  private headers() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.tokenService.getToken()}` }) };
  }

  findByEstacionamiento(id: number): Observable<any[]> {
    return this.https.get<any[]>(`${this.apiUrl}/estacionamiento/${id}`, this.headers());
  }

  findOne(id: number): Observable<any> {
    return this.https.get(`${this.apiUrl}/${id}`, this.headers());
  }

  update(id: number, data: any): Observable<any> {
    return this.https.put(`${this.apiUrl}/${id}`, data, this.headers());
  }

  ajustar(idEst: number, data: any): Observable<any> {
    return this.https.patch(`${this.apiUrl}/estacionamiento/${idEst}/ajustar`, data, this.headers());
  }

  verificarDisponibilidad(idEst: number, tipo: string): Observable<any> {
    return this.https.get(`${this.apiUrl}/estacionamiento/${idEst}/disponibilidad/${tipo}`, this.headers());
  }

  remove(id: number): Observable<void> {
    return this.https.delete<void>(`${this.apiUrl}/${id}`, this.headers());
  }
}