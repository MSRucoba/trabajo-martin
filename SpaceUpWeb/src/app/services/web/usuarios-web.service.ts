import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../token.service';

@Injectable({ providedIn: 'root' })
export class UsuariosWebService {
    private apiUrl = `${environment.apiUrl}/web/usuarios-admin`;

    constructor(private https: HttpClient, private tokenService: TokenService) { }

    private headers() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${this.tokenService.getToken()}`,
            }),
        };
    }

    obtenerUsuarios(page: number = 1, limit: number = 10): Observable<any> {
        return this.https.get(`${this.apiUrl}?page=${page}&limit=${limit}`, this.headers());
    }
}