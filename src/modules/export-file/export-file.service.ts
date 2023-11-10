import { Injectable } from '@nestjs/common';
import { Parser } from 'json2csv';
import * as Exceljs from 'exceljs';
import * as stream from 'stream';
import * as PDFDocument from 'pdfkit-table';

@Injectable()
export class ExportFileService {
  async exportToCSV(data: any[], fields: any[]): Promise<string> {
    const parser = new Parser({
      fields: fields,
    });
    const csv = await parser.parse(data);
    return csv;
  }

  async exportToExcel<T>(data: T[], fields: any[], sheetName: string) {
    type FieldKeyFunction = (row: T) => any;
    const workbook = new Exceljs.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.columns = fields.map((field) => ({
      header: field.header,
      key: field.header,
      width: field.width,
    }));

    for (const row of data) {
      const rowData = {};
      for (const field of fields) {
        const value =
          typeof field.key === 'function'
            ? (field.key as FieldKeyFunction)(row)
            : this.getObjectValue(row, field.key);
        rowData[field.header] = value;
      }
      worksheet.addRow(rowData);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const streamBuffer = new stream.PassThrough();
    streamBuffer.end(buffer);
    return streamBuffer;
  }

  getObjectValue(obj: any, key: string | ((row: any) => any)) {
    if (typeof key === 'string') {
      const keys = key.split('.');
      return keys.reduce((o, k) => (o || {})[k], obj);
    } else if (typeof key === 'function') {
      return key(obj);
    }
    return '';
  }

  async exportToPDF(data: any[], fields: any[], heading: string) {
    const doc = new (PDFDocument as any)({ margin: 30, size: 'A4' });
    doc.font('Helvetica-Bold');
    doc.fontSize(14);
    doc.text(heading, { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica');
    doc.fontSize(10);

    doc.table({
      headers: fields,
      rows: data.map((item) => item),
    });
    return doc;
  }
}
