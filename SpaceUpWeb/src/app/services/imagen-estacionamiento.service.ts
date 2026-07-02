import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class ImagenEstacionamientoService {
  private apiUrl = `${environment.apiUrl}/imagenes-estacionamiento`;
  constructor(private https: HttpClient, private tokenService: TokenService) {}

  private headers() {
    return { headers: new HttpHeaders({ Authorization: `Bearer ${this.tokenService.getToken()}` }) };
  }

  crear(data: any): Observable<any> {
    return this.https.post(this.apiUrl, data, this.headers());
  }

  obtenerTodas(): Observable<any[]> {
    return this.https.get<any[]>(this.apiUrl, this.headers());
  }

  obtenerUna(id: number): Observable<any> {
    return this.https.get(`${this.apiUrl}/${id}`, this.headers());
  }

  actualizar(id: number, data: any): Observable<any> {
    return this.https.put(`${this.apiUrl}/${id}`, data, this.headers());
  }

  eliminar(id: number): Observable<any> {
    return this.https.delete(`${this.apiUrl}/${id}`, this.headers());
  }

  subirImagen(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.https.post(`${this.apiUrl}/upload`, formData, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.tokenService.getToken()}` })
    });
  }
}