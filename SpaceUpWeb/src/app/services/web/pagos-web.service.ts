import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../token.service';

@Injectable({ providedIn: 'root' })
export class PagosWebService {
    private apiUrl = `${environment.apiUrl}/web/pagos-admin`;

    constructor(private https: HttpClient, private tokenService: TokenService) { }

    private headers() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${this.tokenService.getToken()}`,
            }),
        };
    }

    obtenerPagos(page: number = 1, limit: number = 10): Observable<any> {
        return this.https.get(`${this.apiUrl}?page=${page}&limit=${limit}`, this.headers());
    }

    obtenerGananciasMes(year: number, month: number): Observable<any> {
        return this.https.get(
            `${this.apiUrl}/ganancias-mes?year=${year}&month=${month}`,
            this.headers()
        );
    }

    obtenerGananciasAnuales(year: number): Observable<any> {
        return this.https.get(`${this.apiUrl}/ganancias/anual/${year}`);
    }
}