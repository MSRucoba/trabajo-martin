import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PdfGeneratorService } from './pdf-generator.service';
import { GenerarReporteDto, TipoVista } from './dto/generar-reporte.dto';
import { Empresa } from '../empresa/empresa.entity';
import { Estacionamiento } from '../estacionamiento/estacionamiento.entity';
import { Pago } from '../pago/pago.entity';
import { Reserva } from '../reserva/reserva.entity';
import { Usuario } from '../usuario/usuario.entity';
import { EstadoReserva } from '../reserva/enums/estado-reserva.enum';

@Injectable()
export class ReportesService {
  constructor(
    private readonly pdfGenerator: PdfGeneratorService,
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
    @InjectRepository(Estacionamiento)
    private estacionamientoRepo: Repository<Estacionamiento>,
    @InjectRepository(Pago)
    private pagoRepo: Repository<Pago>,
    @InjectRepository(Reserva)
    private reservaRepo: Repository<Reserva>,
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {}

  async generarReporte(dto: GenerarReporteDto): Promise<Buffer> {
    let contenido: any[];
    let titulo: string;

    switch (dto.vista) {
      case TipoVista.EMPRESAS:
        const resultEmpresas = await this.reporteEmpresas(dto.tipoReporte);
        contenido = resultEmpresas.contenido;
        titulo = resultEmpresas.titulo;
        break;

      case TipoVista.ESTACIONAMIENTOS:
        const resultEst = await this.reporteEstacionamientos(dto.tipoReporte);
        contenido = resultEst.contenido;
        titulo = resultEst.titulo;
        break;

      case TipoVista.PAGOS:
        const resultPagos = await this.reportePagos(dto.tipoReporte);
        contenido = resultPagos.contenido;
        titulo = resultPagos.titulo;
        break;

      case TipoVista.RESERVAS:
        const resultReservas = await this.reporteReservas(dto.tipoReporte);
        contenido = resultReservas.contenido;
        titulo = resultReservas.titulo;
        break;

      case TipoVista.USUARIOS:
        const resultUsuarios = await this.reporteUsuarios(dto.tipoReporte);
        contenido = resultUsuarios.contenido;
        titulo = resultUsuarios.titulo;
        break;

      default:
        throw new Error('Vista no válida');
    }

    return this.pdfGenerator.generarPDF(titulo, contenido);
  }

  private async reporteEmpresas(
    tipo: string,
  ): Promise<{ contenido: any[]; titulo: string }> {
    const empresas = await this.empresaRepo.find({
      relations: ['usuario', 'estacionamientos'],
    });

    let contenido: any[];
    let titulo: string;

    switch (tipo) {
      case 'listado-completo':
        titulo = 'Listado Completo de Empresas';
        const rows1 = empresas.map((e) => [
          e.nombre_empresa,
          e.ruc,
          e.numero_contacto,
          `${e.usuario?.nombre || ''} ${e.usuario?.apellido || ''}`,
          e.estacionamientos?.length || 0,
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Empresas', value: empresas.length },
          ]),
          this.pdfGenerator.crearTabla(
            ['Empresa', 'RUC', 'Contacto', 'Anfitrión', 'Estacionamientos'],
            rows1,
          ),
        ];
        break;

      case 'mayor-estacionamientos':
        titulo = 'Empresas con Mayor Cantidad de Estacionamientos';
        const ordenadas = empresas
          .sort(
            (a, b) =>
              (b.estacionamientos?.length || 0) -
              (a.estacionamientos?.length || 0),
          )
          .slice(0, 10);
        const rows2 = ordenadas.map((e) => [
          e.nombre_empresa,
          e.estacionamientos?.length || 0,
          e.ruc,
        ]);
        contenido = [
          this.pdfGenerator.crearTexto('Top 10 empresas', 'subheader'),
          this.pdfGenerator.crearTabla(
            ['Empresa', 'Cantidad Estacionamientos', 'RUC'],
            rows2,
          ),
        ];
        break;

      case 'mayor-ocupacion':
        titulo = 'Empresas con Mayor Ocupación de Cupos';
        const conCupos = empresas
          .map((e) => {
            const totales =
              e.estacionamientos?.reduce(
                (sum, est) => sum + (est.cupos_totales || 0),
                0,
              ) || 0;
            const disponibles =
              e.estacionamientos?.reduce(
                (sum, est) => sum + (est.cupos_disponibles || 0),
                0,
              ) || 0;
            const ocupados = totales - disponibles;
            const porcentaje = totales
              ? ((ocupados / totales) * 100).toFixed(1)
              : '0';
            return { nombre: e.nombre_empresa, totales, ocupados, porcentaje };
          })
          .sort((a, b) => parseFloat(b.porcentaje) - parseFloat(a.porcentaje));
        const rows3 = conCupos.map((e) => [
          e.nombre,
          e.totales,
          e.ocupados,
          `${e.porcentaje}%`,
        ]);
        contenido = [
          this.pdfGenerator.crearTexto(
            'Ordenadas por % ocupación',
            'subheader',
          ),
          this.pdfGenerator.crearTabla(
            ['Empresa', 'Cupos Totales', 'Ocupados', '% Ocupación'],
            rows3,
          ),
        ];
        break;

      case 'anfitriones':
        titulo = 'Reporte de Anfitriones y sus Empresas';
        const rows4 = empresas.map((e) => [
          `${e.usuario?.nombre || ''} ${e.usuario?.apellido || ''}`,
          e.usuario?.email || '',
          e.nombre_empresa,
          e.ruc,
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Anfitriones', value: empresas.length },
          ]),
          this.pdfGenerator.crearTabla(
            ['Anfitrión', 'Email', 'Empresa', 'RUC'],
            rows4,
          ),
        ];
        break;

      case 'cupos-totales':
        titulo = 'Análisis de Cupos Totales por Empresa';
        const conAnalisis = empresas.map((e) => {
          const totales =
            e.estacionamientos?.reduce(
              (sum, est) => sum + (est.cupos_totales || 0),
              0,
            ) || 0;
          const disponibles =
            e.estacionamientos?.reduce(
              (sum, est) => sum + (est.cupos_disponibles || 0),
              0,
            ) || 0;
          return {
            nombre: e.nombre_empresa,
            totales,
            disponibles,
            ocupados: totales - disponibles,
          };
        });
        const rows5 = conAnalisis.map((e) => [
          e.nombre,
          e.totales,
          e.disponibles,
          e.ocupados,
        ]);
        contenido = [
          this.pdfGenerator.crearTexto('Distribución de cupos', 'subheader'),
          this.pdfGenerator.crearTabla(
            ['Empresa', 'Cupos Totales', 'Disponibles', 'Ocupados'],
            rows5,
          ),
        ];
        break;

      default:
        throw new Error('Tipo de reporte no válido para empresas');
    }

    return { contenido, titulo };
  }

  private async reporteEstacionamientos(
    tipo: string,
  ): Promise<{ contenido: any[]; titulo: string }> {
    const estacionamientos = await this.estacionamientoRepo.find({
      relations: ['empresa', 'cuposVehiculo'],
    });

    let contenido: any[];
    let titulo: string;

    switch (tipo) {
      case 'listado-completo':
        titulo = 'Listado Completo de Estacionamientos';
        const rows1 = estacionamientos.map((e) => [
          e.nombre,
          e.direccion,
          e.cupos_totales,
          e.cupos_disponibles,
          e.estado ? 'Activo' : 'Inactivo',
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Estacionamientos', value: estacionamientos.length },
          ]),
          this.pdfGenerator.crearTabla(
            ['Nombre', 'Dirección', 'Cupos Totales', 'Disponibles', 'Estado'],
            rows1,
          ),
        ];
        break;

      case 'ocupacion-tipo-vehiculo':
        titulo = 'Reporte de Ocupación por Tipo de Vehículo';
        const datos: any[] = [];
        estacionamientos.forEach((e) => {
          if (e.cuposVehiculo) {
            e.cuposVehiculo.forEach((cv) => {
              datos.push([
                e.nombre,
                cv.tipo_vehiculo,
                cv.cupos_totales,
                cv.cupos_disponibles,
                cv.cupos_totales - cv.cupos_disponibles,
              ]);
            });
          }
        });
        contenido = [
          this.pdfGenerator.crearTexto('Desglose por tipo', 'subheader'),
          this.pdfGenerator.crearTabla(
            ['Estacionamiento', 'Tipo', 'Totales', 'Disponibles', 'Ocupados'],
            datos,
          ),
        ];
        break;

      case 'mayor-ocupacion':
        titulo = 'Estacionamientos con Mayor Porcentaje de Ocupación';
        const conPorcentaje = estacionamientos
          .map((e) => {
            const ocupados = e.cupos_totales - e.cupos_disponibles;
            const porcentaje = e.cupos_totales
              ? ((ocupados / e.cupos_totales) * 100).toFixed(1)
              : '0';
            return {
              nombre: e.nombre,
              cupos: e.cupos_totales,
              ocupados,
              porcentaje,
            };
          })
          .sort((a, b) => parseFloat(b.porcentaje) - parseFloat(a.porcentaje));
        const rows3 = conPorcentaje.map((e) => [
          e.nombre,
          e.cupos,
          e.ocupados,
          `${e.porcentaje}%`,
        ]);
        contenido = [
          this.pdfGenerator.crearTexto('Ordenados por ocupación', 'subheader'),
          this.pdfGenerator.crearTabla(
            ['Estacionamiento', 'Cupos', 'Ocupados', '% Ocupación'],
            rows3,
          ),
        ];
        break;

      case 'disponibles-ocupados':
        titulo = 'Análisis de Cupos Disponibles vs Ocupados';
        const rows4 = estacionamientos.map((e) => [
          e.nombre,
          e.cupos_totales,
          e.cupos_disponibles,
          e.cupos_totales - e.cupos_disponibles,
        ]);
        contenido = [
          this.pdfGenerator.crearTexto('Estado actual de cupos', 'subheader'),
          this.pdfGenerator.crearTabla(
            ['Estacionamiento', 'Totales', 'Disponibles', 'Ocupados'],
            rows4,
          ),
        ];
        break;

      case 'por-ubicacion':
        titulo = 'Reporte de Estacionamientos por Ubicación';
        const rows5 = estacionamientos.map((e) => [
          e.nombre,
          e.direccion,
          e.empresa?.nombre_empresa || '—',
          e.estado ? 'Activo' : 'Inactivo',
        ]);
        contenido = [
          this.pdfGenerator.crearTexto('Agrupados por ubicación', 'subheader'),
          this.pdfGenerator.crearTabla(
            ['Estacionamiento', 'Dirección', 'Empresa', 'Estado'],
            rows5,
          ),
        ];
        break;

      default:
        throw new Error('Tipo de reporte no válido para estacionamientos');
    }

    return { contenido, titulo };
  }

  private async reportePagos(
    tipo: string,
  ): Promise<{ contenido: any[]; titulo: string }> {
    const pagos = await this.pagoRepo.find({
      relations: ['reserva', 'reserva.vehiculo', 'reserva.vehiculo.usuario'],
      order: { fechaCreacion: 'DESC' },
    });

    let contenido: any[];
    let titulo: string;

    switch (tipo) {
      case 'ingresos-mensuales':
        titulo = 'Reporte de Ingresos Mensuales';
        const now = new Date();
        const mesActual = pagos.filter((p) => {
          const fecha = new Date(p.fechaPago || p.fechaCreacion);
          return (
            fecha.getMonth() === now.getMonth() &&
            fecha.getFullYear() === now.getFullYear() &&
            p.status === 'succeeded'
          );
        });
        const totalMes = mesActual.reduce((sum, p) => sum + Number(p.monto), 0);
        const rows1 = mesActual.map((p) => [
          p.voucherCode,
          new Date(p.fechaPago || p.fechaCreacion).toLocaleDateString(),
          `S/${Number(p.monto).toFixed(2)}`,
          p.status,
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            {
              label: 'Total Ingresos del Mes',
              value: `S/${totalMes.toFixed(2)}`,
            },
          ]),
          this.pdfGenerator.crearTabla(
            ['Factura', 'Fecha', 'Monto', 'Estado'],
            rows1,
          ),
        ];
        break;

      case 'por-estado':
        titulo = 'Historial de Transacciones por Estado';
        const rows2 = pagos.map((p) => {
          const nombreCliente = p.reserva?.vehiculo?.usuario
            ? `${p.reserva.vehiculo.usuario.nombre} ${p.reserva.vehiculo.usuario.apellido}`
            : '—';
          const estadoTexto =
            p.status === 'succeeded'
              ? 'Pagado'
              : p.status === 'pending'
                ? 'Pendiente'
                : 'Fallido';
          return [
            p.voucherCode,
            nombreCliente,
            `S/${Number(p.monto).toFixed(2)}`,
            new Date(p.fechaPago || p.fechaCreacion).toLocaleDateString(),
            estadoTexto,
          ];
        });
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Transacciones', value: pagos.length },
          ]),
          this.pdfGenerator.crearTabla(
            ['Factura', 'Cliente', 'Monto', 'Fecha', 'Estado'],
            rows2,
          ),
        ];
        break;

      case 'exitosos-pendientes':
        titulo = 'Reporte de Pagos Exitosos vs Pendientes';
        const exitosos = pagos.filter((p) => p.status === 'succeeded');
        const pendientes = pagos.filter((p) => p.status === 'pending');
        const totalExitosos = exitosos.reduce(
          (sum, p) => sum + Number(p.monto),
          0,
        );
        const totalPendientes = pendientes.reduce(
          (sum, p) => sum + Number(p.monto),
          0,
        );
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Pagos Exitosos', value: exitosos.length },
            { label: 'Monto Exitosos', value: `S/${totalExitosos.toFixed(2)}` },
            { label: 'Pagos Pendientes', value: pendientes.length },
            {
              label: 'Monto Pendientes',
              value: `S/${totalPendientes.toFixed(2)}`,
            },
          ]),
        ];
        break;

      case 'comisiones':
        titulo = 'Análisis de Comisiones del Sistema';
        const conComision = pagos
          .filter((p) => p.status === 'succeeded')
          .map((p) => {
            return {
              voucher: p.voucherCode,
              monto: Number(p.monto),
              comision: Number(p.commissionCents) / 100,
              neto: Number(p.netAmountCents) / 100,
            };
          });
        const totalComisiones = conComision.reduce(
          (sum, p) => sum + p.comision,
          0,
        );
        const rows4 = conComision.map((p) => [
          p.voucher,
          `S/${p.monto.toFixed(2)}`,
          `S/${p.comision.toFixed(2)}`,
          `S/${p.neto.toFixed(2)}`,
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            {
              label: 'Total Comisiones',
              value: `S/${totalComisiones.toFixed(2)}`,
            },
          ]),
          this.pdfGenerator.crearTabla(
            ['Factura', 'Monto Total', 'Comisión', 'Neto'],
            rows4,
          ),
        ];
        break;

      case 'por-cliente':
        titulo = 'Reporte de Ingresos por Cliente';
        const porCliente: Map<
          string,
          { nombre: string; total: number; cantidad: number }
        > = new Map();
        pagos
          .filter((p) => p.status === 'succeeded')
          .forEach((p) => {
            const nombre = p.reserva?.vehiculo?.usuario
              ? `${p.reserva.vehiculo.usuario.nombre} ${p.reserva.vehiculo.usuario.apellido}`
              : 'Desconocido';
            const actual = porCliente.get(nombre) || {
              nombre,
              total: 0,
              cantidad: 0,
            };
            actual.total += Number(p.monto);
            actual.cantidad += 1;
            porCliente.set(nombre, actual);
          });
        const clientesArray = Array.from(porCliente.values()).sort(
          (a, b) => b.total - a.total,
        );
        const rows5 = clientesArray.map((c) => [
          c.nombre,
          c.cantidad,
          `S/${c.total.toFixed(2)}`,
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Clientes', value: porCliente.size },
          ]),
          this.pdfGenerator.crearTabla(
            ['Cliente', 'Transacciones', 'Total'],
            rows5,
          ),
        ];
        break;

      case 'resumen-financiero':
        titulo = 'Resumen Financiero General';
        const exitososFin = pagos.filter((p) => p.status === 'succeeded');
        const totalIngresos = exitososFin.reduce(
          (sum, p) => sum + Number(p.monto),
          0,
        );
        const totalComisionesFin = exitososFin.reduce(
          (sum, p) => sum + Number(p.commissionCents) / 100,
          0,
        );
        const totalNeto = exitososFin.reduce(
          (sum, p) => sum + Number(p.netAmountCents) / 100,
          0,
        );
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Transacciones Exitosas', value: exitososFin.length },
            {
              label: 'Ingresos Brutos',
              value: `S/${totalIngresos.toFixed(2)}`,
            },
            {
              label: 'Comisiones Sistema',
              value: `S/${totalComisionesFin.toFixed(2)}`,
            },
            { label: 'Ingresos Netos', value: `S/${totalNeto.toFixed(2)}` },
          ]),
        ];
        break;

      default:
        throw new Error('Tipo de reporte no válido para pagos');
    }

    return { contenido, titulo };
  }

  private async reporteReservas(
    tipo: string,
  ): Promise<{ contenido: any[]; titulo: string }> {
    const reservas = await this.reservaRepo.find({
      relations: [
        'usuario',
        'vehiculo',
        'vehiculo.tipoVehiculo',
        'estacionamiento',
      ],
      order: { fechaReserva: 'DESC' },
    });

    let contenido: any[];
    let titulo: string;

    switch (tipo) {
      case 'por-estado':
        titulo = 'Listado de Reservas por Estado';
        const rows1 = reservas.map((r) => [
          r.codigoReserva,
          `${r.usuario?.nombre || ''} ${r.usuario?.apellido || ''}`,
          r.estacionamiento?.nombre || '—',
          new Date(r.fechaInicio).toLocaleDateString(),
          r.estado,
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Reservas', value: reservas.length },
          ]),
          this.pdfGenerator.crearTabla(
            ['Código', 'Conductor', 'Estacionamiento', 'Fecha', 'Estado'],
            rows1,
          ),
        ];
        break;

      case 'del-dia-mes':
        titulo = 'Reporte de Reservas del Día/Mes';
        const hoy = new Date();
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const delMes = reservas.filter(
          (r) => new Date(r.fechaReserva) >= inicioMes,
        );
        const rows2 = delMes.map((r) => [
          r.codigoReserva,
          new Date(r.fechaReserva).toLocaleDateString(),
          `${r.usuario?.nombre || ''} ${r.usuario?.apellido || ''}`,
          r.estacionamiento?.nombre || '—',
          `S/${Number(r.total).toFixed(2)}`,
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Reservas del Mes', value: delMes.length },
          ]),
          this.pdfGenerator.crearTabla(
            ['Código', 'Fecha', 'Conductor', 'Estacionamiento', 'Monto'],
            rows2,
          ),
        ];
        break;

      case 'por-estacionamiento':
        titulo = 'Análisis de Reservas por Estacionamiento';
        const porEst: Map<string, number> = new Map();
        reservas.forEach((r) => {
          const nombre = r.estacionamiento?.nombre || 'Desconocido';
          porEst.set(nombre, (porEst.get(nombre) || 0) + 1);
        });
        const estArray = Array.from(porEst.entries()).sort(
          (a, b) => b[1] - a[1],
        );
        const rows3 = estArray.map(([nombre, cantidad]) => [nombre, cantidad]);
        contenido = [
          this.pdfGenerator.crearTexto(
            'Distribución por estacionamiento',
            'subheader',
          ),
          this.pdfGenerator.crearTabla(
            ['Estacionamiento', 'Cantidad Reservas'],
            rows3,
          ),
        ];
        break;

      case 'conductores-frecuentes':
        titulo = 'Reporte de Conductores con Más Reservas';
        const porConductor: Map<
          string,
          { nombre: string; cantidad: number; total: number }
        > = new Map();
        reservas.forEach((r) => {
          const nombre = `${r.usuario?.nombre || ''} ${r.usuario?.apellido || ''}`;
          const actual = porConductor.get(nombre) || {
            nombre,
            cantidad: 0,
            total: 0,
          };
          actual.cantidad += 1;
          actual.total += Number(r.total);
          porConductor.set(nombre, actual);
        });
        const conductoresArray = Array.from(porConductor.values())
          .sort((a, b) => b.cantidad - a.cantidad)
          .slice(0, 20);
        const rows4 = conductoresArray.map((c) => [
          c.nombre,
          c.cantidad,
          `S/${c.total.toFixed(2)}`,
        ]);
        contenido = [
          this.pdfGenerator.crearTexto('Top 20 conductores', 'subheader'),
          this.pdfGenerator.crearTabla(
            ['Conductor', 'Reservas', 'Total Gastado'],
            rows4,
          ),
        ];
        break;

      case 'cancelaciones':
        titulo = 'Estadísticas de Cancelaciones';
        const canceladas = reservas.filter(
          (r) => r.estado === EstadoReserva.CANCELADO,
        );
        const porcentajeCancelacion =
          reservas.length > 0
            ? ((canceladas.length / reservas.length) * 100).toFixed(1)
            : '0';
        const rows5 = canceladas.map((r) => [
          r.codigoReserva,
          `${r.usuario?.nombre || ''} ${r.usuario?.apellido || ''}`,
          new Date(r.fechaReserva).toLocaleDateString(),
          r.estacionamiento?.nombre || '—',
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Cancelaciones', value: canceladas.length },
            { label: 'Porcentaje', value: `${porcentajeCancelacion}%` },
          ]),
          this.pdfGenerator.crearTabla(
            ['Código', 'Conductor', 'Fecha', 'Estacionamiento'],
            rows5,
          ),
        ];
        break;

      case 'ingresos-reservas':
        titulo = 'Reporte de Ingresos por Reservas';
        const completadas = reservas.filter(
          (r) => r.estado === EstadoReserva.FINALIZADO,
        );
        const totalIngresosRes = completadas.reduce(
          (sum, r) => sum + Number(r.total),
          0,
        );
        const rows6 = completadas.map((r) => [
          r.codigoReserva,
          `${r.usuario?.nombre || ''} ${r.usuario?.apellido || ''}`,
          new Date(r.fechaInicio).toLocaleDateString(),
          `S/${Number(r.total).toFixed(2)}`,
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Reservas Completadas', value: completadas.length },
            {
              label: 'Ingresos Totales',
              value: `S/${totalIngresosRes.toFixed(2)}`,
            },
          ]),
          this.pdfGenerator.crearTabla(
            ['Código', 'Conductor', 'Fecha', 'Monto'],
            rows6,
          ),
        ];
        break;

      default:
        throw new Error('Tipo de reporte no válido para reservas');
    }

    return { contenido, titulo };
  }

  private async reporteUsuarios(
    tipo: string,
  ): Promise<{ contenido: any[]; titulo: string }> {
    const usuarios = await this.usuarioRepo.find({
      relations: ['empresa'],
      order: { fechaRegistro: 'DESC' },
    });

    let contenido: any[];
    let titulo: string;

    switch (tipo) {
      case 'por-rol':
        titulo = 'Listado de Usuarios por Rol';
        const rows1 = usuarios.map((u) => [
          `${u.nombre} ${u.apellido}`,
          u.email,
          u.dni,
          u.rol,
          new Date(u.fechaRegistro).toLocaleDateString(),
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Usuarios', value: usuarios.length },
          ]),
          this.pdfGenerator.crearTabla(
            ['Nombre', 'Email', 'DNI', 'Rol', 'Registro'],
            rows1,
          ),
        ];
        break;

      case 'conductores':
        titulo = 'Reporte de Conductores Registrados';
        const conductores = usuarios.filter((u) => u.rol === 'CONDUCTOR');
        const rows2 = conductores.map((u) => [
          `${u.nombre} ${u.apellido}`,
          u.email,
          u.phone || '—',
          new Date(u.fechaRegistro).toLocaleDateString(),
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Conductores', value: conductores.length },
          ]),
          this.pdfGenerator.crearTabla(
            ['Nombre', 'Email', 'Teléfono', 'Registro'],
            rows2,
          ),
        ];
        break;

      case 'encargados':
        titulo = 'Reporte de Encargados por Empresa';
        const encargados = usuarios.filter((u) => u.rol === 'ENCARGADO');
        const rows3 = encargados.map((u) => [
          `${u.nombre} ${u.apellido}`,
          u.email,
          u.empresa?.nombre_empresa || '—',
        ]);
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Encargados', value: encargados.length },
          ]),
          this.pdfGenerator.crearTabla(['Nombre', 'Email', 'Empresa'], rows3),
        ];
        break;

      case 'activos-inactivos':
        titulo = 'Análisis de Usuarios por Rol';
        const conductoresCount = usuarios.filter(
          (u) => u.rol === 'CONDUCTOR',
        ).length;
        const encargadosCount = usuarios.filter(
          (u) => u.rol === 'ENCARGADO',
        ).length;
        const anfitrionesCount = usuarios.filter(
          (u) => u.rol === 'ANFITRION',
        ).length;
        const adminsCount = usuarios.filter((u) => u.rol === 'ADMIN').length;
        contenido = [
          this.pdfGenerator.crearResumen([
            { label: 'Total Usuarios', value: usuarios.length },
            { label: 'Conductores', value: conductoresCount },
            { label: 'Encargados', value: encargadosCount },
            { label: 'Anfitriones', value: anfitrionesCount },
            { label: 'Administradores', value: adminsCount },
          ]),
        ];
        break;

      case 'registro-temporal':
        titulo = 'Reporte de Fecha de Registro de Usuarios';
        const porMes: Map<string, number> = new Map();
        for (const u of usuarios) {
          const fechaReg = new Date(u.fechaRegistro);
          const mesKey = `${fechaReg.getMonth() + 1}/${fechaReg.getFullYear()}`;
          porMes.set(mesKey, (porMes.get(mesKey) || 0) + 1);
        }
        const mesArray = Array.from(porMes.entries());
        const rows5 = mesArray.map((entry) => [entry[0], entry[1]]);
        contenido = [
          this.pdfGenerator.crearTexto('Registros por mes', 'subheader'),
          this.pdfGenerator.crearTabla(
            ['Mes/Año', 'Cantidad Registros'],
            rows5,
          ),
        ];
        break;

      default:
        throw new Error('Tipo de reporte no válido para usuarios');
    }

    return { contenido, titulo };
  }
}
