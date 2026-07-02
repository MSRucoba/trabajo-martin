import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class EmpresaService {
  private apiUrl = `${environment.apiUrl}/empresa`;

  constructor(private https: HttpClient, private tokenService: TokenService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.tokenService.getToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getEmpresas(): Observable<any[]> {
    return this.https.get<any[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  buscarEmpresasPorNombre(nombre: string): Observable<any[]> {
    return this.https.get<any[]>(`${this.apiUrl}`, { headers: this.getAuthHeaders() });
    // Luego puedes filtrar en frontend o implementar un endpoint /empresa/search/:nombre
  }

  verificarRuc(ruc: string): Observable<any> {
    return this.https.get<any>(`${this.apiUrl}/verificar/${ruc}`);
  }

  crearEmpresa(data: any): Observable<any> {
    return this.https.post(this.apiUrl, data, { headers: this.getAuthHeaders() });
  }

  actualizarEmpresa(id: number, data: any): Observable<any> {
    return this.https.put(`${this.apiUrl}/${id}`, data, { headers: this.getAuthHeaders() });
  }

  eliminarEmpresa(id: number): Observable<void> {
    return this.https.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }
}