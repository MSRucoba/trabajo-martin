import { Component, OnInit } from '@angular/core';
import { EstacionamientosWebService } from '../../services/web/estacionamientos-web.service';
import { LoaderService } from '../../services/components/loader.service';

@Component({
  selector: 'app-estacionamientos',
  templateUrl: './estacionamientos.component.html',
  styleUrls: ['./estacionamientos.component.css'],
})
export class EstacionamientosComponent implements OnInit {
  loading = true;
  estacionamientos: any[] = [];
  todosEstacionamientos: any[] = [];

  totalEstacionamientos = 0;
  totalCupos = 0;
  totalOcupados = 0;
  totalDisponibles = 0;
  porcentajeOcupacion = 0;
  paginaActual = 1;
  totalPaginas = 1;

  constructor(
    private estacionamientosWebService: EstacionamientosWebService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.loaderService.show();
    this.cargarEstacionamientos();
  }

  private cargarEstacionamientos() {
    this.loading = true;
    this.estacionamientosWebService
      .obtenerEstacionamientos(this.paginaActual, 5)
      .subscribe({
        next: (response) => {
          const data = response.data || response;
          this.estacionamientos = data.estacionamientos || [];
          this.totalPaginas = data.totalPages || 1;
          
          if (this.paginaActual === 1) {
            this.todosEstacionamientos = data.todosEstacionamientos || this.estacionamientos;
          }
          
          this.calcularTotales();
          this.loading = false;
          
          this.loaderService.hideWithDelay(5000);
        },
        error: (err) => {
          console.error('Error al cargar estacionamientos:', err);
          this.loading = false;
          this.loaderService.hide();
        },
      });
  }

  private calcularTotales() {
    const dataParaCalcular = this.todosEstacionamientos.length > 0 ? this.todosEstacionamientos : this.estacionamientos;
    
    this.totalEstacionamientos = dataParaCalcular.length;
    this.totalCupos = dataParaCalcular.reduce(
      (sum, e) => sum + (e.cupos_totales || 0),
      0
    );
    this.totalDisponibles = dataParaCalcular.reduce(
      (sum, e) => sum + (e.cupos_disponibles || 0),
      0
    );
    this.totalOcupados = this.totalCupos - this.totalDisponibles;

    this.porcentajeOcupacion = this.totalCupos
      ? Number(((this.totalOcupados / this.totalCupos) * 100).toFixed(1))
      : 0;
  }

  calcularOcupados(est: any): number {
    return (est.cuposTotales || est.cupos_totales || 0) - (est.cuposDisponibles || est.cupos_disponibles || 0);
  }

  calcularPorcentaje(est: any): number {
    const totales = est.cuposTotales || est.cupos_totales || 0;
    const disponibles = est.cuposDisponibles || est.cupos_disponibles || 0;
    if (!totales) return 0;
    return +( ((totales - disponibles) / totales) * 100 ).toFixed(1);
  }

  obtenerColorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 80) return '#e53935';
    if (porcentaje >= 60) return '#fb8c00';
    return '#43a047';
  }

  cambiarPagina(direccion: number): void {
    const nuevaPagina = this.paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.cargarEstacionamientos();
    }
  }
}