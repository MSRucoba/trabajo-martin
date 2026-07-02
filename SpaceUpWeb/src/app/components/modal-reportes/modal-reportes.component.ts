import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesService } from '../../services/reportes.service';

@Component({
    selector: 'app-modal-reportes',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './modal-reportes.component.html',
    styleUrls: ['./modal-reportes.component.css'],
})
export class ModalReportesComponent implements OnInit {
    @Input() vista!: string;
    @Output() cerrar = new EventEmitter<void>();

    opciones: { label: string; value: string }[] = [];
    generando = false;

    constructor(private reportesService: ReportesService) {}

    ngOnInit(): void {
        this.opciones = this.reportesService.obtenerOpcionesReporte(this.vista);
    }

    cerrarModal(): void {
        this.cerrar.emit();
    }

    generarReporte(tipoReporte: string): void {
        this.generando = true;

        this.reportesService.generarReporte(this.vista, tipoReporte).subscribe({
            next: (blob) => {
                const nombreArchivo = `reporte-${this.vista}-${tipoReporte}-${Date.now()}.pdf`;
                this.reportesService.descargarPDF(blob, nombreArchivo);
                this.generando = false;
                this.cerrarModal();
            },
            error: (err) => {
                console.error('Error al generar reporte:', err);
                alert('Error al generar el reporte. Intenta nuevamente.');
                this.generando = false;
            },
        });
    }
}