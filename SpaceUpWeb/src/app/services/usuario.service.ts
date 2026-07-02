import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  
  constructor(
    private https: HttpClient,
    private tokenService: TokenService
  ) {}

  private headers() {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.tokenService.getToken()}`,
      }),
    };
  }

  findOne(id: number): Observable<any> {
    return this.https.get(`${this.apiUrl}/${id}`, this.headers());
  }

  updateProfile(id: number, data: any): Observable<any> {
    return this.https.patch(`${this.apiUrl}/${id}`, data, this.headers());
  }

  updatePassword(id: number, data: any): Observable<any> {
    return this.https.patch(`${this.apiUrl}/${id}/password`, data, this.headers());
  }

  updateImage(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', file);
    
    return this.https.patch(`${this.apiUrl}/${id}/imagen`, formData, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.tokenService.getToken()}`,
      }),
    });
  }
}