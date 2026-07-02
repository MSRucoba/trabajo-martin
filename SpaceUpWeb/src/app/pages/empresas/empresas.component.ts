import { Component, OnInit } from '@angular/core';
import { EmpresasWebService } from '../../services/web/empresas-web.service';
import { EstacionamientoService } from '../../services/estacionamiento.service';
import { LoaderService } from '../../services/components/loader.service';

@Component({
  selector: 'app-empresas',
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.css'],
})
export class EmpresaComponent implements OnInit {
  empresas: any[] = [];
  empresasOriginal: any[] = [];
  filtro: string = '';
  cargando: boolean = false;
  errorMensaje: string = '';
  empresaSeleccionada: number | null = null;
  estacionamientos: { [key: number]: any[] } = {};

  paginaActual = 1;
  totalPaginas = 1;
  elementosPorPagina = 10;

  constructor(
    private empresasWebService: EmpresasWebService,
    private estacionamientoService: EstacionamientoService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.loaderService.show();
    this.cargarEmpresas();
  }

  cargarEmpresas(): void {
    this.cargando = true;
    this.empresasWebService
      .obtenerEmpresas(this.paginaActual, this.elementosPorPagina)
      .subscribe({
        next: (response) => {
          const data = response.data || response;
          this.empresas = data.empresas || [];
          this.empresasOriginal = [...this.empresas];
          this.totalPaginas = data.totalPages || 1;
          this.cargando = false;
          
          this.loaderService.hideWithDelay(5000);
        },
        error: (err) => {
          console.error('Error al cargar empresas:', err);
          this.errorMensaje = 'Error al cargar empresas.';
          this.cargando = false;
          this.loaderService.hide();
        },
      });
  }

  buscarEmpresa(): void {
    const filtroLower = this.filtro.trim().toLowerCase();
    if (!filtroLower) {
      this.empresas = [...this.empresasOriginal];
      return;
    }
    this.empresas = this.empresasOriginal.filter((e) =>
      (e.nombreEmpresa || '').toLowerCase().includes(filtroLower)
    );
  }

  toggleEstacionamientos(idEmpresa: number): void {
    if (this.empresaSeleccionada === idEmpresa) {
      this.empresaSeleccionada = null;
      return;
    }
    this.empresaSeleccionada = idEmpresa;

    if (this.estacionamientos[idEmpresa]) return;

    this.estacionamientoService.obtenerPorEmpresa(idEmpresa).subscribe({
      next: (data) => {
        this.estacionamientos[idEmpresa] = data.length ? data : [];
      },
      error: () => {
        this.estacionamientos[idEmpresa] = [];
      },
    });
  }

  getEncargadoNombre(e: any): string {
    if (!e.encargado) return '—';
    return `${e.encargado.nombre} ${e.encargado.apellido_paterno || ''} ${e.encargado.apellido_materno || ''}`.trim();
  }

  cambiarPagina(direccion: number): void {
    const nuevaPagina = this.paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.cargarEmpresas();
    }
  }
}