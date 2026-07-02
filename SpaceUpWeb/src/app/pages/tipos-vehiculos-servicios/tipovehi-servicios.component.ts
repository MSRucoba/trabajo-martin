import { Component, OnInit } from '@angular/core';
import { TipoVehiculoService } from '../../services/tipo-vehiculo.service';
import { ServicioService } from '../../services/servicio.service';
import { LoaderService } from '../../services/components/loader.service';

@Component({
    selector: 'app-tipovehi-servicios',
    templateUrl: './tipovehi-servicios.component.html',
    styleUrls: ['./tipovehi-servicios.component.css']
})
export class TipovehiServiciosComponent implements OnInit {

    tipoVehiculoList: any[] = [];
    servicioList: any[] = [];

    showModal: boolean = false;
    modalTitle: string = '';
    activeEntity: 'vehiculo' | 'servicio' = 'vehiculo';
    editing: boolean = false;
    currentId: number | null = null;
    nombreInput: string = '';

    showAlert: boolean = false;
    alertMessage: string = '';
    alertType: 'success' | 'error' = 'success';

    pageVehiculo = 1;
    pageServicio = 1;
    itemsPerPage = 10;

    constructor(
        private tipoVehiculoService: TipoVehiculoService,
        private servicioService: ServicioService,
        private loaderService: LoaderService
    ) { }

    ngOnInit(): void {
        this.loaderService.show();
        this.cargarListas();
    }

    cargarListas() {
        let vehiculosCargados = false;
        let serviciosCargados = false;

        this.tipoVehiculoService.obtenerTodos().subscribe({
            next: (res: any) => {
                this.tipoVehiculoList = res.data || res;
                vehiculosCargados = true;
                if (vehiculosCargados && serviciosCargados) {
                    this.loaderService.hideWithDelay(5000);
                }
            },
            error: () => {
                this.mostrarAlerta('Error al cargar tipos de vehículo', 'error');
                this.loaderService.hide();
            }
        });

        this.servicioService.obtenerTodos().subscribe({
            next: (res: any) => {
                this.servicioList = res.data || res;
                serviciosCargados = true;
                if (vehiculosCargados && serviciosCargados) {
                    this.loaderService.hideWithDelay(5000);
                }
            },
            error: () => {
                this.mostrarAlerta('Error al cargar servicios', 'error');
                this.loaderService.hide();
            }
        });
    }

    abrirModal(entidad: 'vehiculo' | 'servicio', editar = false, item?: any) {
        this.activeEntity = entidad;
        this.editing = editar;
        this.modalTitle = editar
            ? `Editar ${entidad === 'vehiculo' ? 'Tipo de Vehículo' : 'Servicio'}`
            : `Nuevo ${entidad === 'vehiculo' ? 'Tipo de Vehículo' : 'Servicio'}`;
        this.showModal = true;
        this.nombreInput = editar ? item?.nombre : '';
        this.currentId = editar ? item?.id || item?.id_servicio : null;
    }

    cerrarModal() {
        this.showModal = false;
        this.nombreInput = '';
        this.currentId = null;
    }

    guardarCambios() {
        const data = { nombre: this.nombreInput.trim() };
        if (!data.nombre) {
            this.mostrarAlerta('El nombre es obligatorio', 'error');
            return;
        }

        if (this.activeEntity === 'vehiculo') {
            if (this.editing && this.currentId) {
                this.tipoVehiculoService.actualizar(this.currentId, data).subscribe({
                    next: () => {
                        this.mostrarAlerta('Tipo de vehículo actualizado', 'success');
                        this.cerrarModal();
                        this.cargarListas();
                    },
                    error: (err) =>
                        this.mostrarAlerta(err.error.message || 'Error al actualizar', 'error')
                });
            } else {
                this.tipoVehiculoService.crear(data).subscribe({
                    next: () => {
                        this.mostrarAlerta('Tipo de vehículo creado', 'success');
                        this.cerrarModal();
                        this.cargarListas();
                    },
                    error: (err) =>
                        this.mostrarAlerta(err.error.message || 'Error al crear', 'error')
                });
            }
        } else {
            if (this.editing && this.currentId) {
                this.servicioService.actualizar(this.currentId, data).subscribe({
                    next: () => {
                        this.mostrarAlerta('Servicio actualizado', 'success');
                        this.cerrarModal();
                        this.cargarListas();
                    },
                    error: (err) =>
                        this.mostrarAlerta(err.error.message || 'Error al actualizar', 'error')
                });
            } else {
                this.servicioService.crear(data).subscribe({
                    next: () => {
                        this.mostrarAlerta('Servicio creado', 'success');
                        this.cerrarModal();
                        this.cargarListas();
                    },
                    error: (err) =>
                        this.mostrarAlerta(err.error.message || 'Error al crear', 'error')
                });
            }
        }
    }

    eliminar(entidad: 'vehiculo' | 'servicio', id: number) {
        if (!confirm('¿Seguro que deseas eliminar este registro?')) return;

        if (entidad === 'vehiculo') {
            this.tipoVehiculoService.eliminar(id).subscribe({
                next: () => {
                    this.mostrarAlerta('Tipo de vehículo eliminado', 'success');
                    this.cargarListas();
                },
                error: (err) =>
                    this.mostrarAlerta(err.error.message || 'Error al eliminar', 'error')
            });
        } else {
            this.servicioService.eliminar(id).subscribe({
                next: () => {
                    this.mostrarAlerta('Servicio eliminado', 'success');
                    this.cargarListas();
                },
                error: (err) =>
                    this.mostrarAlerta(err.error.message || 'Error al eliminar', 'error')
            });
        }
    }

    get paginatedTipoVehiculo() {
        const start = (this.pageVehiculo - 1) * this.itemsPerPage;
        return this.tipoVehiculoList.slice(start, start + this.itemsPerPage);
    }

    get paginatedServicio() {
        const start = (this.pageServicio - 1) * this.itemsPerPage;
        return this.servicioList.slice(start, start + this.itemsPerPage);
    }

    totalPages(list: any[]) {
        return Math.ceil(list.length / this.itemsPerPage);
    }

    nextPage(entidad: 'vehiculo' | 'servicio') {
        if (entidad === 'vehiculo' && this.pageVehiculo < this.totalPages(this.tipoVehiculoList))
            this.pageVehiculo++;
        if (entidad === 'servicio' && this.pageServicio < this.totalPages(this.servicioList))
            this.pageServicio++;
    }

    prevPage(entidad: 'vehiculo' | 'servicio') {
        if (entidad === 'vehiculo' && this.pageVehiculo > 1)
            this.pageVehiculo--;
        if (entidad === 'servicio' && this.pageServicio > 1)
            this.pageServicio--;
    }

    mostrarAlerta(mensaje: string, tipo: 'success' | 'error') {
        this.alertMessage = mensaje;
        this.alertType = tipo;
        this.showAlert = true;
        setTimeout(() => (this.showAlert = false), 3000);
    }
}