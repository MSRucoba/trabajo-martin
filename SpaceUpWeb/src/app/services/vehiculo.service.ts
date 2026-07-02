import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class VehiculoService {
  private apiUrl = `${environment.apiUrl}/vehiculos`;

  constructor(private https: HttpClient, private tokenService: TokenService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.tokenService.getToken()}`,
      'Content-Type': 'application/json'
    });
  }

  crearVehiculo(data: any): Observable<any> {
    return this.https.post(this.apiUrl, data, { headers: this.getHeaders() });
  }

  obtenerTodos(): Observable<any[]> {
    return this.https.get<any[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  obtenerPorUsuario(id: number): Observable<any[]> {
    return this.https.get<any[]>(`${this.apiUrl}/usuario/${id}`, { headers: this.getHeaders() });
  }

  obtenerStats(id: number): Observable<any> {
    return this.https.get(`${this.apiUrl}/usuario/${id}/stats`, { headers: this.getHeaders() });
  }

  validarReserva(id: number): Observable<any> {
    return this.https.get(`${this.apiUrl}/validar/${id}`, { headers: this.getHeaders() });
  }

  actualizarVehiculo(id: number, data: any): Observable<any> {
    return this.https.put(`${this.apiUrl}/${id}`, data, { headers: this.getHeaders() });
  }

  desactivarVehiculo(id: number): Observable<any> {
    return this.https.patch(`${this.apiUrl}/${id}/deactivate`, {}, { headers: this.getHeaders() });
  }

  eliminarVehiculo(id: number): Observable<void> {
    return this.https.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}