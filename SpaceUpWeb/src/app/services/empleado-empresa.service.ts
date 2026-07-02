import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({ 
    providedIn: 'root' 
})
export class EmpleadoEmpresaService {
  private apiUrl = `${environment.apiUrl}/empleado-empresa`;
  
  constructor(private https: HttpClient, private tokenService: TokenService) {}

  private headers() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.tokenService.getToken()}` }) };
  }

  crear(data: any): Observable<any> {
    return this.https.post(this.apiUrl, data, this.headers());
  }

  crearEncargadoCuenta(data: any): Observable<any> {
    return this.https.post(`${this.apiUrl}/crear-cuenta`, data, this.headers());
  }

  obtenerPorEmpresa(id: number): Observable<any[]> {
    return this.https.get<any[]>(`${this.apiUrl}/empresa/${id}`, this.headers());
  }

  actualizarEstado(id: number, data: any): Observable<any> {
    return this.https.patch(`${this.apiUrl}/${id}`, data, this.headers());
  }

  eliminar(id: number): Observable<void> {
    return this.https.delete<void>(`${this.apiUrl}/${id}`, this.headers());
  }
}