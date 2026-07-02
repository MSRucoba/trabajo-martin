import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class EstacionamientoService {
  private apiUrl = `${environment.apiUrl}/estacionamiento`;
  constructor(private https: HttpClient, private tokenService: TokenService) {}

  private headers() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.tokenService.getToken()}` }) };
  }

  crear(data: any): Observable<any> {
    return this.https.post(this.apiUrl, data, this.headers());
  }

  obtenerTodos(): Observable<any[]> {
    return this.https.get<any[]>(this.apiUrl, this.headers());
  }

  obtenerActivos(): Observable<any[]> {
    return this.https.get<any[]>(`${this.apiUrl}/activos`, this.headers());
  }

  obtenerPorEmpresa(idEmpresa: number): Observable<any[]> {
    return this.https.get<any[]>(`${this.apiUrl}/empresa/${idEmpresa}`, this.headers());
  }

  obtenerPorUsuario(idUsuario: number): Observable<any[]> {
    return this.https.get<any[]>(`${this.apiUrl}/usuario/${idUsuario}`, this.headers());
  }

  obtenerUno(id: number): Observable<any> {
    return this.https.get(`${this.apiUrl}/${id}`, this.headers());
  }

  actualizar(id: number, data: any): Observable<any> {
    return this.https.put(`${this.apiUrl}/${id}`, data, this.headers());
  }

  activar(id: number, estado: boolean): Observable<any> {
    return this.https.patch(`${this.apiUrl}/${id}/activar`, { estado }, this.headers());
  }

  recalcularCupos(id: number): Observable<any> {
    return this.https.patch(`${this.apiUrl}/${id}/recalcular-cupos`, {}, this.headers());
  }

  eliminar(id: number): Observable<void> {
    return this.https.delete<void>(`${this.apiUrl}/${id}`, this.headers());
  }

  subirImagenTemporal(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.https.post(`${this.apiUrl}/upload-temp`, formData, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.tokenService.getToken()}` })
    });
  }
}