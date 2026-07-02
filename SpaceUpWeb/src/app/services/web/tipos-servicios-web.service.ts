import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from '../token.service';

@Injectable({ providedIn: 'root' })
export class TiposServiciosWebService {
    private apiUrl = `${environment.apiUrl}/web/tipos-servicios-admin`;

    constructor(private https: HttpClient, private tokenService: TokenService) { }

    private headers() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${this.tokenService.getToken()}`,
            }),
        };
    }

    obtenerTiposVehiculo(page: number = 1, limit: number = 10): Observable<any> {
        return this.https.get(
            `${this.apiUrl}/tipos-vehiculo?page=${page}&limit=${limit}`,
            this.headers()
        );
    }

    obtenerServicios(page: number = 1, limit: number = 10): Observable<any> {
        return this.https.get(
            `${this.apiUrl}/servicios?page=${page}&limit=${limit}`,
            this.headers()
        );
    }
}