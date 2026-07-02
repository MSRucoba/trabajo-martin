import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({
    providedIn: 'root',
})
export class ReportesService {
    private apiUrl = `${environment.apiUrl}/reportes`;

    constructor(private https: HttpClient, private tokenService: TokenService) { }

    private headers() {
        return {
            headers: new HttpHeaders({
                Authorization: `Bearer ${this.tokenService.getToken()}`,
            }),
            responseType: 'blob' as 'json',
        };
    }

    generarReporte(vista: string, tipoReporte: string): Observable<Blob> {
        return this.https.post<Blob>(
            `${this.apiUrl}/generar`,
            { vista, tipoReporte },
            this.headers()
        );
    }

    descargarPDF(blob: Blob, nombreArchivo: string): void {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    obtenerOpcionesReporte(vista: string): { label: string; value: string }[] {
        const opciones: Record<string, { label: string; value: string }[]> = {
            empresas: [
                { label: 'Listado Completo de Empresas', value: 'listado-completo' },
                { label: 'Empresas con Más Estacionamientos', value: 'mayor-estacionamientos' },
                { label: 'Empresas con Mayor Ocupación', value: 'mayor-ocupacion' },
                { label: 'Anfitriones y sus Empresas', value: 'anfitriones' },
                { label: 'Cupos Totales por Empresa', value: 'cupos-totales' },
            ],
            estacionamientos: [
                { label: 'Listado Completo de Estacionamientos', value: 'listado-completo' },
                { label: 'Ocupación por Tipo de Vehículo', value: 'ocupacion-tipo-vehiculo' },
                { label: 'Mayor Porcentaje de Ocupación', value: 'mayor-ocupacion' },
                { label: 'Disponibles vs Ocupados', value: 'disponibles-ocupados' },
                { label: 'Estacionamientos por Ubicación', value: 'por-ubicacion' },
            ],
            pagos: [
                { label: 'Ingresos Mensuales', value: 'ingresos-mensuales' },
                { label: 'Transacciones por Estado', value: 'por-estado' },
                { label: 'Pagos Exitosos vs Pendientes', value: 'exitosos-pendientes' },
                { label: 'Análisis de Comisiones', value: 'comisiones' },
                { label: 'Ingresos por Cliente', value: 'por-cliente' },
                { label: 'Resumen Financiero', value: 'resumen-financiero' },
            ],
            reservas: [
                { label: 'Reservas por Estado', value: 'por-estado' },
                { label: 'Reservas del Día/Mes', value: 'del-dia-mes' },
                { label: 'Por Estacionamiento', value: 'por-estacionamiento' },
                { label: 'Conductores Frecuentes', value: 'conductores-frecuentes' },
                { label: 'Estadísticas de Cancelaciones', value: 'cancelaciones' },
                { label: 'Ingresos por Reservas', value: 'ingresos-reservas' },
            ],
            usuarios: [
                { label: 'Usuarios por Rol', value: 'por-rol' },
                { label: 'Conductores Registrados', value: 'conductores' },
                { label: 'Encargados por Empresa', value: 'encargados' },
                { label: 'Usuarios Activos/Inactivos', value: 'activos-inactivos' },
                { label: 'Registro Temporal', value: 'registro-temporal' },
            ],
        };

        return opciones[vista] || [];
    }
}