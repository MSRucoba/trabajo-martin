import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private apiUrl = `${environment.apiUrl}/reservas`;

  constructor(private https: HttpClient, private tokenService: TokenService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.tokenService.getToken()}`,
      'Content-Type': 'application/json'
    });
  }

  crearReserva(data: any): Observable<any> {
    return this.https.post(this.apiUrl, data, { headers: this.getHeaders() });
  }

  previsualizar(idEst: number, idVeh: number, inicio: string, fin: string): Observable<any> {
    return this.https.get(`${this.apiUrl}/previsualizar?id_estacionamiento=${idEst}&id_vehiculo=${idVeh}&fechaInicio=${inicio}&fechaFin=${fin}`, { headers: this.getHeaders() });
  }

  cancelar(id: number): Observable<any> {
    return this.https.delete(`${this.apiUrl}/cancelar/${id}`, { headers: this.getHeaders() });
  }

  finalizar(id: number): Observable<any> {
    return this.https.put(`${this.apiUrl}/finalizar/${id}`, {}, { headers: this.getHeaders() });
  }

  actualizarEstados(): Observable<any> {
    return this.https.post(`${this.apiUrl}/actualizar-estados`, {}, { headers: this.getHeaders() });
  }

  obtenerTodas(): Observable<any> {
    return this.https.get(`${this.apiUrl}`, { headers: this.getHeaders() });
  }

  obtenerUna(id: number): Observable<any> {
    return this.https.get(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  actualizar(id: number, data: any): Observable<any> {
    return this.https.put(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }
}