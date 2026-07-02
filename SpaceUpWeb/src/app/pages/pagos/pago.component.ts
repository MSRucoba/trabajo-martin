import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagosWebService } from '../../services/web/pagos-web.service';
import { LoaderService } from '../../services/components/loader.service';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { BotonReporteComponent } from '../../components/boton-reporte/boton-reporte.component';

Chart.register(...registerables);

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, NgChartsModule, BotonReporteComponent],
  templateUrl: './pago.component.html',
  styleUrls: ['./pago.component.css'],
})
export class PagoComponent implements OnInit {
  pagos: any[] = [];
  totalIngresos = 0;
  totalPagados = 0;
  totalPendientes = 0;
  totalTransacciones = 0;

  paginaActual = 1;
  totalPaginas = 1;

  vistaGrafico: 'mensual' | 'diaria' = 'diaria';

  ingresosMensuales: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Ingresos (S/)',
        data: [],
        borderColor: '#5b56d6',
        backgroundColor: 'rgba(91, 86, 214, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#5b56d6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  opcionesGrafico: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(91, 86, 214, 0.9)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12 },
          color: '#6b6b8a'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(147, 133, 254, 0.1)',
        },
        ticks: {
          callback: (val) => `S/${val}`,
          font: { size: 12 },
          color: '#6b6b8a'
        },
      },
    },
  };

  constructor(
    private pagosWebService: PagosWebService,
    private loaderService: LoaderService
  ) { }

  ngOnInit(): void {
    this.loaderService.show();
    this.cargarPagos();
    this.cargarGrafico();
  }

  cargarPagos() {
    let pagosCargados = false;
    const graficoCargado = true;

    this.pagosWebService.obtenerPagos(this.paginaActual, 10).subscribe({
      next: (response: any) => {
        const data = response.data || response;
        this.pagos = data.pagos || [];
        this.totalPaginas = data.totalPages || 1;
        this.calcularTotales();
        pagosCargados = true;
        if (pagosCargados && graficoCargado) {
          this.loaderService.hideWithDelay(5000);
        }
      },
      error: (err) => {
        console.error('Error al obtener pagos:', err);
        this.loaderService.hide();
      },
    });
  }

  cargarGrafico() {
    if (this.vistaGrafico === 'diaria') {
      this.cargarGraficoDiario();
    } else {
      this.cargarGraficoMensual();
    }
  }

  cargarGraficoDiario() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    this.pagosWebService.obtenerGananciasMes(year, month).subscribe({
      next: (response: any) => {
        const ganancias = response.data || [];
        this.generarGraficoDiario(ganancias);
        this.verificarCargaCompleta();
      },
      error: (err) => {
        console.error('Error al cargar ganancias diarias:', err);
        this.loaderService.hide();
      },
    });
  }

  cargarGraficoMensual() {
    const now = new Date();
    const year = now.getFullYear();

    this.pagosWebService.obtenerGananciasAnuales(year).subscribe({
      next: (response: any) => {
        const ganancias = response.data || [];
        this.generarGraficoMensual(ganancias);
        this.verificarCargaCompleta();
      },
      error: (err) => {
        console.error('Error al cargar ganancias mensuales:', err);
        this.generarGraficoMensualDefault();
        this.verificarCargaCompleta();
      },
    });
  }

  verificarCargaCompleta() {
    if (this.pagos.length >= 0 && this.ingresosMensuales.labels && this.ingresosMensuales.labels.length > 0) {
      this.loaderService.hideWithDelay(5000);
    }
  }

  generarGraficoDiario(ganancias: any[]) {
    const dias = ganancias.map((g) => `Día ${g.dia}`);
    const montos = ganancias.map((g) => g.monto);

    this.ingresosMensuales.labels = dias;
    this.ingresosMensuales.datasets[0].data = montos;
  }

  generarGraficoMensual(ganancias: any[]) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const montosPorMes = new Array(12).fill(0);

    ganancias.forEach((g) => {
      const mesIndex = g.mes - 1;
      if (mesIndex >= 0 && mesIndex < 12) {
        montosPorMes[mesIndex] = g.monto;
      }
    });

    this.ingresosMensuales.labels = meses;
    this.ingresosMensuales.datasets[0].data = montosPorMes;
  }

  generarGraficoMensualDefault() {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const montos = new Array(12).fill(0);

    this.ingresosMensuales.labels = meses;
    this.ingresosMensuales.datasets[0].data = montos;
  }

  cambiarVistaGrafico(vista: 'mensual' | 'diaria') {
    this.vistaGrafico = vista;
    this.cargarGrafico();
  }

  calcularTotales() {
    this.totalTransacciones = this.pagos.length;
    this.totalPagados = this.pagos.filter((p) => p.status === 'succeeded').length;
    this.totalPendientes = this.pagos.filter((p) => p.status !== 'succeeded').length;

    this.totalIngresos = this.pagos
      .filter((p) => p.status === 'succeeded')
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'succeeded':
        return 'linear-gradient(135deg, #43a047 0%, #66bb6a 100%)';
      case 'pending':
        return 'linear-gradient(135deg, #ffb300 0%, #ffca28 100%)';
      case 'failed':
        return 'linear-gradient(135deg, #e53935 0%, #ef5350 100%)';
      default:
        return 'linear-gradient(135deg, #9e9e9e 0%, #bdbdbd 100%)';
    }
  }

  obtenerNombreCliente(pago: any): string {
    return pago.nombreCliente || '—';
  }

  obtenerFactura(pago: any): string {
    return pago.voucherCode || `FAC-${pago.id}`;
  }

  cambiarPagina(direccion: number): void {
    const nuevaPagina = this.paginaActual + direccion;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.cargarPagos();
    }
  }
}