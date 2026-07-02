import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../token.service';

@Injectable({ providedIn: 'root' })
export class LogsService {
    private apiUrl = `${environment.apiUrl}/web/logs`;

    constructor(private https: HttpClient, private tokenService: TokenService) { }

    private headers() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${this.tokenService.getToken()}`,
            }),
        };
    }

    obtenerUltimosLogs(lineas: number = 100): Observable<any> {
        return this.https.get(`${this.apiUrl}/tail?lines=${lineas}`, this.headers());
    }

    buscarEnLogs(query: string): Observable<any> {
        return this.https.get(`${this.apiUrl}/search?query=${query}`, this.headers());
    }

    limpiarLogs(): Observable<any> {
        return this.https.get(`${this.apiUrl}/clear`, this.headers());
    }
}