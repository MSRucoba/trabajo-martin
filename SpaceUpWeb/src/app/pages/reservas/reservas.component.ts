import { Component, OnInit } from '@angular/core';
import { ReservasWebService } from '../../services/web/reservas-web.service';
import { LoaderService } from '../../services/components/loader.service';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css'],
})
export class ReservasComponent implements OnInit {
  reservas: any[] = [];
  reservasPaginadas: any[] = [];
  todasReservas: any[] = [];
  cargando = false;

  totalReservas = 0;
  activas = 0;
  completadas = 0;
  ingresosHoy = 0;

  paginaActual = 1;
  totalPaginas = 1;
  elementosPorPagina = 10;

  constructor(
    private reservasWebService: ReservasWebService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.loaderService.show();
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.cargando = true;
    this.reservasWebService
      .obtenerReservas(this.paginaActual, this.elementosPorPagina)
      .subscribe({
        next: (response) => {
          const data = response.data || response;
          
          this.reservasPaginadas = data.reservas || [];
          this.totalPaginas = data.totalPages || 1;
          this.totalReservas = data.total || this.reservasPaginadas.length;
          
          if (this.paginaActual === 1 && data.todasReservas) {
            this.todasReservas = data.todasReservas;
          }
          
          this.calcularResumen();
          this.cargando = false;
          
          this.loaderService.hideWithDelay(5000);
        },
        error: (err) => {
          console.error('Error al cargar reservas:', err);
          this.cargando = false;
          this.loaderService.hide();
        },
      });
  }

  calcularResumen(): void {
    const dataParaCalcular = this.todasReservas.length > 0 ? this.todasReservas : this.reservasPaginadas;
    
    this.activas = dataParaCalcular.filter(
      (r) => r.estado?.toUpperCase() === 'CONSUMO'
    ).length;
    
    this.completadas = dataParaCalcular.filter(
      (r) => r.estado?.toUpperCase() === 'FINALIZADO'
    ).length;

    const hoy = new Date();
    const fechaHoyStr = hoy.toISOString().split('T')[0];

    const reservasRegistradasHoy = dataParaCalcular.filter((r) => {
      const fechaReservaStr = r.fechaReserva ? new Date(r.fechaReserva).toISOString().split('T')[0] : null;
      const fueRegistradaHoy = fechaReservaStr === fechaHoyStr;
      const estadoValido = r.estado?.toUpperCase() !== 'CANCELADO';
      return fueRegistradaHoy && estadoValido;
    });

    this.ingresosHoy = reservasRegistradasHoy.reduce((acc, r) => acc + Number(r.total || 0), 0);
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.cargarReservas();
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cargarReservas();
    }
  }
}