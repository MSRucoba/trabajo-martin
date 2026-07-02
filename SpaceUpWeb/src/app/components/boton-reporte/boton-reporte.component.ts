import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalReportesComponent } from '../modal-reportes/modal-reportes.component';

@Component({
    selector: 'app-boton-reporte',
    standalone: true,
    imports: [CommonModule, ModalReportesComponent],
    templateUrl: './boton-reporte.component.html',
    styleUrls: ['./boton-reporte.component.css'],
})
export class BotonReporteComponent {
    @Input() vista!: string;
    mostrarModal = false;

    abrirModal(): void {
        this.mostrarModal = true;
    }

    cerrarModal(): void {
        this.mostrarModal = false;
    }
}