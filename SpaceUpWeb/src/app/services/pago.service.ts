import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private apiUrl = `${environment.apiUrl}/pagos`;
  constructor(private https: HttpClient, private tokenService: TokenService) {}

  private headers() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.tokenService.getToken()}` }) };
  }

  crearPago(data: any): Observable<any> {
    return this.https.post(this.apiUrl, data, this.headers());
  }

  cancelarReserva(idReserva: number): Observable<any> {
    return this.https.delete(`${this.apiUrl}/cancelar/${idReserva}`, this.headers());
  }

  obtenerPagos(): Observable<any[]> {
    return this.https.get<any[]>(this.apiUrl, this.headers());
  }

  obtenerPago(id: number): Observable<any> {
    return this.https.get(`${this.apiUrl}/${id}`, this.headers());
  }

  actualizarPago(id: number, data: any): Observable<any> {
    return this.https.put(`${this.apiUrl}/${id}`, data, this.headers());
  }
}