import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DocTypeMeta, BaseDoc, DocField } from '../types/erp';

export interface ExportColumn {
  fieldname: string;
  label: string;
  fieldtype: string;
  included: boolean;
}

export interface ExportOptions {
  format: 'pdf' | 'csv';
  scope: 'all' | 'selected';
  includeMetadata: boolean;
  includeSummaryTotals: boolean;
  orientation: 'portrait' | 'landscape';
  columns: ExportColumn[];
  activeFilter?: string;
  searchQuery?: string;
  userRole?: string;
}

/**
 * Generates an RFC 4180 compliant CSV string and initiates a browser download.
 */
export function exportTableToCSV(
  meta: DocTypeMeta,
  docs: BaseDoc[],
  options: {
    columns: ExportColumn[];
    includeMetadata?: boolean;
    includeSummaryTotals?: boolean;
    activeFilter?: string;
    searchQuery?: string;
    userRole?: string;
  }
) {
  const activeCols = options.columns.filter((c) => c.included);
  const now = new Date();
  const dateStr = now.toISOString().substring(0, 10);
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

  const lines: string[] = [];

  // Metadata Header block if requested
  if (options.includeMetadata) {
    lines.push(`"Aether Technologies ERP - Data Export"`);
    lines.push(`"DocType:","${escapeCSV(meta.name)}","Module:","${escapeCSV(meta.module)}"`);
    lines.push(`"Generated At:","${dateStr} ${timeStr}","Exported By:","${escapeCSV(options.userRole || 'User')}"`);
    if (options.activeFilter && options.activeFilter !== 'All') {
      lines.push(`"Filter Applied:","${escapeCSV(options.activeFilter)}"`);
    }
    if (options.searchQuery) {
      lines.push(`"Search Query:","${escapeCSV(options.searchQuery)}"`);
    }
    lines.push(`"Total Records:","${docs.length}"`);
    lines.push(''); // Blank row separator
  }

  // Column Headers
  const headerRow = ['ID', ...activeCols.map((c) => c.label), 'Owner', 'Modified'];
  lines.push(headerRow.map(escapeCSV).join(','));

  // Data Rows
  docs.forEach((doc) => {
    const row = [
      doc.name,
      ...activeCols.map((col) => {
        const val = doc[col.fieldname];
        if (val === undefined || val === null) return '';
        if (col.fieldtype === 'Currency') {
          return Number(val || 0).toFixed(2);
        }
        return String(val);
      }),
      doc.owner || 'Administrator',
      doc.modified || doc.creation || '',
    ];
    lines.push(row.map(escapeCSV).join(','));
  });

  // Optional Summary Totals Row
  if (options.includeSummaryTotals) {
    const totalsRow: string[] = ['TOTALS'];
    activeCols.forEach((col) => {
      if (col.fieldtype === 'Currency' || col.fieldtype === 'Float' || col.fieldtype === 'Int') {
        const sum = docs.reduce((acc, d) => acc + (Number(d[col.fieldname]) || 0), 0);
        totalsRow.push(col.fieldtype === 'Currency' ? sum.toFixed(2) : String(Math.round(sum * 100) / 100));
      } else {
        totalsRow.push('');
      }
    });
    totalsRow.push(''); // Owner
    totalsRow.push(''); // Modified
    lines.push(totalsRow.map(escapeCSV).join(','));
  }

  // Prepend UTF-8 BOM for Microsoft Excel / Numbers compatibility
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${meta.name.toLowerCase().replace(/\s+/g, '_')}_export_${dateStr}.csv`;

  downloadBlob(blob, filename);
}

/**
 * Generates an enterprise-formatted PDF file using jsPDF & autotable.
 */
export function exportTableToPDF(
  meta: DocTypeMeta,
  docs: BaseDoc[],
  options: {
    columns: ExportColumn[];
    orientation?: 'portrait' | 'landscape';
    includeMetadata?: boolean;
    includeSummaryTotals?: boolean;
    activeFilter?: string;
    searchQuery?: string;
    userRole?: string;
  }
) {
  const activeCols = options.columns.filter((c) => c.included);
  const now = new Date();
  const dateStr = now.toISOString().substring(0, 10);
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

  // Auto determine orientation if not explicitly set: landscape if > 5 columns
  const orientation = options.orientation || (activeCols.length > 5 ? 'landscape' : 'portrait');
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Corporate Header ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 52, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('AETHER TECHNOLOGIES ERP', 30, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Official Document Register · Module: ${meta.module}`, 30, 42);

  const timestampText = `Exported: ${dateStr} ${timeStr}`;
  doc.text(timestampText, pageWidth - 30 - doc.getTextWidth(timestampText), 28);

  const roleText = `Operator: ${options.userRole || 'System Manager'}`;
  doc.text(roleText, pageWidth - 30 - doc.getTextWidth(roleText), 42);

  // --- Report Title & Filter summary ---
  let startY = 74;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(`${meta.name} Register`, 30, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  let filterDesc = `Showing ${docs.length} record${docs.length === 1 ? '' : 's'}`;
  if (options.activeFilter && options.activeFilter !== 'All') {
    filterDesc += ` · Status Filter: ${options.activeFilter}`;
  }
  if (options.searchQuery) {
    filterDesc += ` · Search: "${options.searchQuery}"`;
  }
  doc.text(filterDesc, 30, startY + 14);

  startY += 26;

  // --- Table Headers & Data Rows ---
  const headers = ['ID', ...activeCols.map((c) => c.label), 'Modified'];

  const rows = docs.map((d) => [
    d.name,
    ...activeCols.map((col) => {
      const val = d[col.fieldname];
      if (val === undefined || val === null) return '—';
      if (col.fieldtype === 'Currency') {
        return `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (col.fieldtype === 'Int' || col.fieldtype === 'Float') {
        return Number(val || 0).toLocaleString('en-US');
      }
      return String(val);
    }),
    d.modified ? d.modified.substring(5, 16) : '—',
  ]);

  // Compute Totals Row if requested
  let foot: string[][] | undefined = undefined;
  if (options.includeSummaryTotals) {
    const footRow: string[] = ['TOTALS'];
    activeCols.forEach((col) => {
      if (col.fieldtype === 'Currency') {
        const sum = docs.reduce((acc, d) => acc + (Number(d[col.fieldname]) || 0), 0);
        footRow.push(`$${sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      } else if (col.fieldtype === 'Float' || col.fieldtype === 'Int') {
        const sum = docs.reduce((acc, d) => acc + (Number(d[col.fieldname]) || 0), 0);
        footRow.push(sum.toLocaleString('en-US'));
      } else {
        footRow.push('');
      }
    });
    footRow.push(''); // Modified column
    foot = [footRow];
  }

  // Column styles mapping (right-align numeric columns)
  const columnStyles: Record<number, any> = {
    0: { font: 'courier', fontStyle: 'bold', cellWidth: 'wrap' },
  };

  activeCols.forEach((col, idx) => {
    const colIndex = idx + 1;
    if (col.fieldtype === 'Currency' || col.fieldtype === 'Int' || col.fieldtype === 'Float') {
      columnStyles[colIndex] = { halign: 'right', font: 'courier' };
    }
  });
  // Modified col
  columnStyles[activeCols.length + 1] = { halign: 'right', font: 'courier', textColor: [100, 116, 139] };

  // Render AutoTable
  autoTable(doc, {
    startY,
    head: [headers],
    body: rows,
    foot,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 4.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    footStyles: {
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      font: 'courier',
      lineWidth: 1,
      lineColor: [148, 163, 184],
    },
    columnStyles,
    margin: { left: 30, right: 30, bottom: 40 },
    didDrawPage: (data) => {
      // Footer page numbers
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const str = `Page ${data.pageNumber} of ${doc.getNumberOfPages()} · AetherERP Enterprise System`;
      doc.text(str, pageWidth / 2, pageHeight - 18, { align: 'center' });
    },
  });

  const filename = `${meta.name.toLowerCase().replace(/\s+/g, '_')}_export_${dateStr}.pdf`;
  doc.save(filename);
}

function escapeCSV(val: any): string {
  const str = String(val ?? '');
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
