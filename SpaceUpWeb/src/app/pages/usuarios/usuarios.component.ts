import { Component, OnInit } from '@angular/core';
import { UsuariosWebService } from '../../services/web/usuarios-web.service';
import { LoaderService } from '../../services/components/loader.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  paginaActual = 1;
  totalPaginas = 1;
  elementosPorPagina = 10;
  filtro = '';

  totalConductores = 0;
  totalEncargados = 0;
  totalAnfitriones = 0;
  totalAdmins = 0;

  loading = true;

  constructor(
    private usuariosWebService: UsuariosWebService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.loaderService.show();
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading = true;
    this.usuariosWebService
      .obtenerUsuarios(this.paginaActual, this.elementosPorPagina)
      .subscribe({
        next: (response) => {
          const data = response.data || response;
          this.usuarios = data.usuarios || [];
          this.usuariosFiltrados = [...this.usuarios];
          this.totalPaginas = data.totalPages || 1;
          this.calcularTotales();
          this.loading = false;
          
          this.loaderService.hideWithDelay(5000);
        },
        error: (err) => {
          console.error('Error al cargar usuarios:', err);
          this.loading = false;
          this.loaderService.hide();
        },
      });
  }

  calcularTotales() {
    this.totalConductores = this.usuarios.filter((u) => u.rol === 'CONDUCTOR').length;
    this.totalEncargados = this.usuarios.filter((u) => u.rol === 'ENCARGADO').length;
    this.totalAnfitriones = this.usuarios.filter((u) => u.rol === 'ANFITRION').length;
    this.totalAdmins = this.usuarios.filter((u) => u.rol === 'ADMIN').length;
  }

  buscarUsuario() {
    const texto = this.filtro.toLowerCase().trim();
    this.usuariosFiltrados = this.usuarios.filter(
      (u) =>
        (u.nombre || '').toLowerCase().includes(texto) ||
        (u.apellido || '').toLowerCase().includes(texto) ||
        (u.email || '').toLowerCase().includes(texto)
    );
  }

  get usuariosPaginados() {
    return this.usuariosFiltrados;
  }

  get finPagina(): number {
    return this.usuariosFiltrados.length;
  }

  siguientePagina() {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.cargarUsuarios();
    }
  }

  anteriorPagina() {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.cargarUsuarios();
    }
  }

  colorRol(rol: string): string {
    switch (rol) {
      case 'CONDUCTOR':
        return '#5b56d6';
      case 'ENCARGADO':
        return '#9575cd';
      case 'ANFITRION':
        return '#ffb300';
      case 'ADMIN':
        return '#43a047';
      default:
        return '#999';
    }
  }
}