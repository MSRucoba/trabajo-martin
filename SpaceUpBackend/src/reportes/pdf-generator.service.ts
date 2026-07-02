import { Injectable } from '@nestjs/common';
import * as pdfMakeLib from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

@Injectable()
export class PdfGeneratorService {
  private pdfMake: any;

  constructor() {
    const fonts: any = pdfFonts;

    if (fonts?.pdfMake?.vfs) {
      (pdfMakeLib as any).vfs = fonts.pdfMake.vfs;
    } else if (fonts?.vfs) {
      (pdfMakeLib as any).vfs = fonts.vfs;
    } else {
      (pdfMakeLib as any).vfs = fonts;
    }

    this.pdfMake = pdfMakeLib;
  }

  private getHeader(titulo: string): any {
    return {
      columns: [
        {
          text: 'SPACEUP',
          fontSize: 14,
          bold: true,
          color: '#5b56d6',
          width: 80,
        },
        {
          text: titulo,
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 80, 0],
        },
      ],
      margin: [40, 20, 40, 20],
    };
  }

  private getFooter(): any {
    return (currentPage: number, pageCount: number): any => ({
      text: `Página ${currentPage} de ${pageCount} | Generado: ${new Date().toLocaleString('es-PE')}`,
      alignment: 'center',
      fontSize: 8,
      margin: [0, 10, 0, 0],
    });
  }

  private getStyles(): any {
    return {
      header: {
        fontSize: 18,
        bold: true,
        color: '#5b56d6',
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
      },
      tableHeader: {
        bold: true,
        fontSize: 11,
        color: 'white',
        fillColor: '#5b56d6',
      },
      normal: {
        fontSize: 10,
      },
    };
  }

  async generarPDF(titulo: string, contenido: any[]): Promise<Buffer> {
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 80, 40, 60],
      header: this.getHeader(titulo),
      footer: this.getFooter(),
      content: contenido,
      styles: this.getStyles(),
    };

    return new Promise((resolve) => {
      const pdfDocGenerator = this.pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      });
    });
  }

  crearTabla(headers: string[], rows: any[][], widths?: any[]): any {
    return {
      table: {
        headerRows: 1,
        widths: widths || Array(headers.length).fill('*'),
        body: [
          headers.map((h) => ({ text: h, style: 'tableHeader' })),
          ...rows.map((row) =>
            row.map((cell) => ({ text: String(cell ?? '—'), fontSize: 10 })),
          ),
        ],
      },
      layout: 'lightHorizontalLines',
      margin: [0, 5, 0, 15],
    };
  }

  crearResumen(items: { label: string; value: string | number }[]): any {
    return {
      columns: items.map((item) => ({
        stack: [
          { text: item.label, fontSize: 10, color: '#666' },
          {
            text: String(item.value),
            fontSize: 16,
            bold: true,
            color: '#5b56d6',
          },
        ],
        width: '*',
      })),
      margin: [0, 0, 0, 20],
    };
  }

  crearTexto(texto: string, estilo?: string): any {
    return { text: texto, style: estilo || 'normal', margin: [0, 5, 0, 5] };
  }

  crearSaltoLinea(): any {
    return { text: '\n' };
  }
}
