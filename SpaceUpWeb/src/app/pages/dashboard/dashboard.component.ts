import { Component, OnInit } from '@angular/core';
import { DashboardWebService } from '../../services/web/dashboard-web.service';
import { TipoVehiculoService } from '../../services/tipo-vehiculo.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { LoaderService } from '../../services/components/loader.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  loading = true;

  totalEmpresas = 0;
  totalEstacionamientos = 0;
  usuariosActivos = 0;
  vehiculosTotales = 0;
  tiposVehiculo = 0;
  reservasHoy = 0;
  reservasActivas = 0;
  ingresosMes = 0;
  variacionIngresos = '—';

  alertas: any[] = [];
  actividades: any[] = [];

  constructor(
    private dashboardWebService: DashboardWebService,
    private tipoVehiculoService: TipoVehiculoService,
    private vehiculoService: VehiculoService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.loaderService.show();
    this.cargarDatosDashboard();
  }

  private convertirAArray(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data && typeof data === 'object') {
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      
      if (data.result && Array.isArray(data.result)) {
        return data.result;
      }
      
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      }
      
      const valores = Object.values(data);
      if (valores.length > 0 && valores.every(v => typeof v === 'object' && v !== null)) {
        return valores;
      }
    }
    
    return [];
  }

  private cargarDatosDashboard() {
    this.loading = true;

    forkJoin({
      estadisticas: this.dashboardWebService.obtenerEstadisticas(),
      tiposVehiculo: this.tipoVehiculoService.obtenerTodos(),
      vehiculos: this.vehiculoService.obtenerTodos()
    }).subscribe({
      next: (response) => {
        console.log('📊 RESPUESTA COMPLETA:', response);

        const data = response.estadisticas?.data || response.estadisticas;
        
        this.totalEmpresas = data.empresasActivas || 0;
        this.totalEstacionamientos = data.estacionamientosTotales || 0;
        this.usuariosActivos = data.usuariosRegistrados || 0;
        this.reservasActivas = data.reservasActivas || 0;
        this.ingresosMes = data.ingresosMesActual || 0;
        this.reservasHoy = data.reservasDelMes || 0;

        const tiposArray = this.convertirAArray(response.tiposVehiculo);
        const vehiculosArray = this.convertirAArray(response.vehiculos);

        this.tiposVehiculo = tiposArray.length;
        this.vehiculosTotales = vehiculosArray.length;

        console.log('✅ CONVERSIÓN EXITOSA:');
        console.log('- Tipos Vehículo Array:', tiposArray);
        console.log('- Vehículos Array:', vehiculosArray);
        console.log('- Total Tipos:', this.tiposVehiculo);
        console.log('- Total Vehículos:', this.vehiculosTotales);

        this.generarAlertasConDatos(data);
        this.generarActividadesConDatos(data);

        this.loading = false;
        
        this.loaderService.hideWithDelay(5000);
      },
      error: (err) => {
        console.error('❌ Error al cargar dashboard:', err);
        this.cargarDatosMinimos();
        this.loading = false;
        this.loaderService.hide();
      },
    });
  }

  private cargarDatosMinimos() {
    this.alertas = [{
      tipo: 'danger',
      titulo: 'Error de Conexión',
      detalle: 'No se pudieron cargar todos los datos del sistema'
    }];
    
    this.actividades = [{
      tipo: 'user',
      titulo: 'Sistema en Espera',
      detalle: 'Reintentando conexión con el servidor',
      tiempo: 'Ahora'
    }];
  }

  private generarAlertasConDatos(data: any) {
    this.alertas = [];

    if (this.totalEstacionamientos > 0) {
      this.alertas.push({
        tipo: 'info',
        titulo: 'Sistema Operativo',
        detalle: `${this.totalEstacionamientos} estacionamiento${this.totalEstacionamientos > 1 ? 's' : ''} activo${this.totalEstacionamientos > 1 ? 's' : ''} en el sistema`
      });
    }

    if (this.totalEmpresas > 0) {
      this.alertas.push({
        tipo: 'info',
        titulo: 'Empresas Registradas',
        detalle: `Total de ${this.totalEmpresas} empresa${this.totalEmpresas > 1 ? 's' : ''} en la plataforma`
      });
    }

    if (this.reservasActivas > 0) {
      this.alertas.push({
        tipo: 'info',
        titulo: 'Reservas Activas',
        detalle: `${this.reservasActivas} reserva${this.reservasActivas > 1 ? 's' : ''} en curso`
      });
    }

    if (this.vehiculosTotales === 0) {
      this.alertas.push({
        tipo: 'danger',
        titulo: 'Sin Vehículos',
        detalle: 'No hay vehículos registrados en el sistema'
      });
    }

    if (this.alertas.length === 0) {
      this.alertas.push({
        tipo: 'info',
        titulo: 'Sistema Iniciado',
        detalle: 'El sistema está funcionando correctamente'
      });
    }
  }

  private generarActividadesConDatos(data: any) {
    this.actividades = [];

    if (this.usuariosActivos > 0) {
      this.actividades.push({
        tipo: 'user',
        titulo: 'Usuarios Registrados',
        detalle: `${this.usuariosActivos} usuario${this.usuariosActivos > 1 ? 's' : ''} en el sistema`,
        tiempo: 'Total'
      });
    }

    if (this.vehiculosTotales > 0) {
      this.actividades.push({
        tipo: 'user',
        titulo: 'Vehículos Registrados',
        detalle: `${this.vehiculosTotales} vehículo${this.vehiculosTotales > 1 ? 's' : ''} de ${this.tiposVehiculo} tipo${this.tiposVehiculo > 1 ? 's' : ''}`,
        tiempo: 'Sistema'
      });
    }

    if (this.ingresosMes > 0) {
      this.actividades.push({
        tipo: 'pago',
        titulo: 'Ingresos del Mes',
        detalle: `S/${this.ingresosMes.toFixed(2)} generados este mes`,
        tiempo: 'Mensual'
      });
    }

    if (this.reservasHoy > 0) {
      this.actividades.push({
        tipo: 'user',
        titulo: 'Reservas del Mes',
        detalle: `${this.reservasHoy} reserva${this.reservasHoy > 1 ? 's' : ''} registrada${this.reservasHoy > 1 ? 's' : ''}`,
        tiempo: 'Mes Actual'
      });
    }

    if (this.actividades.length === 0) {
      this.actividades.push({
        tipo: 'user',
        titulo: 'Sin Actividad Reciente',
        detalle: 'No hay actividad registrada',
        tiempo: 'Ahora'
      });
    }
  }
}