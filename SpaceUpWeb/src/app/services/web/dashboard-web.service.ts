import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../token.service';

@Injectable({ providedIn: 'root' })
export class DashboardWebService {
    private apiUrl = `${environment.apiUrl}/web/dashboard`;

    constructor(private https: HttpClient, private tokenService: TokenService) { }

    private headers() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${this.tokenService.getToken()}`,
            }),
        };
    }

    obtenerEstadisticas(): Observable<any> {
        return this.https.get(`${this.apiUrl}/stats`, this.headers());
    }
}