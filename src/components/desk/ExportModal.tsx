import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Table, 
  Check, 
  Sliders, 
  CheckSquare, 
  Square,
  FileCheck2,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { DocTypeMeta, BaseDoc } from '../../types/erp';
import { ExportColumn, ExportOptions, exportTableToCSV, exportTableToPDF } from '../../utils/exportUtils';

interface ExportModalProps {
  meta: DocTypeMeta;
  allFilteredDocs: BaseDoc[];
  selectedDocNames: string[];
  userRole?: string;
  activeFilter?: string;
  searchQuery?: string;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  meta,
  allFilteredDocs,
  selectedDocNames,
  userRole,
  activeFilter,
  searchQuery,
  onClose,
}) => {
  const hasSelection = selectedDocNames.length > 0;

  // Format selection
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');

  // Scope: 'selected' if rows are checked, otherwise 'all'
  const [scope, setScope] = useState<'all' | 'selected'>(hasSelection ? 'selected' : 'all');

  // Options
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeSummaryTotals, setIncludeSummaryTotals] = useState(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // Columns: initialize with all available DocType fields, default to in_list_view
  const [columns, setColumns] = useState<ExportColumn[]>(() => {
    return meta.fields.map((f) => ({
      fieldname: f.fieldname,
      label: f.label,
      fieldtype: f.fieldtype,
      included: !!f.in_list_view,
    }));
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Compute docs to export based on scope
  const targetDocs = scope === 'selected' && hasSelection
    ? allFilteredDocs.filter((d) => selectedDocNames.includes(d.name))
    : allFilteredDocs;

  const selectedColCount = columns.filter((c) => c.included).length;

  const handleToggleColumn = (fieldname: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.fieldname === fieldname ? { ...c, included: !c.included } : c))
    );
  };

  const handleSelectAllColumns = (val: boolean) => {
    setColumns((prev) => prev.map((c) => ({ ...c, included: val })));
  };

  const handleExecuteExport = async () => {
    if (selectedColCount === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    setIsExporting(true);
    // Short micro-delay for UI responsiveness
    await new Promise((r) => setTimeout(r, 120));

    try {
      if (format === 'csv') {
        exportTableToCSV(meta, targetDocs, {
          columns,
          includeMetadata,
          includeSummaryTotals,
          activeFilter,
          searchQuery,
          userRole,
        });
      } else {
        exportTableToPDF(meta, targetDocs, {
          columns,
          orientation,
          includeMetadata,
          includeSummaryTotals,
          activeFilter,
          searchQuery,
          userRole,
        });
      }

      setExportComplete(true);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
      setIsExporting(false);
    }
  };

  const nowStr = new Date().toISOString().substring(0, 10);
  const previewFilename = `${meta.name.toLowerCase().replace(/\s+/g, '_')}_export_${nowStr}.${format}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Export {meta.name} Table View
              </h2>
              <p className="text-xs text-slate-500">
                Generate formatted enterprise PDF reports or raw CSV spreadsheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Format Selection (PDF vs CSV) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              1. Choose Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  format === 'pdf'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${format === 'pdf' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Formatted PDF Report</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">.pdf</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Polished corporate document with letterhead, grid lines, monetary formatting, and page numbers.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  format === 'csv'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${format === 'csv' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>CSV Spreadsheet</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">.csv</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    RFC 4180 standard spreadsheet with UTF-8 BOM, ready for Excel, Google Sheets, or data pipelines.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Record Scope */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              2. Select Records Scope
            </label>
            <div className="flex items-center gap-3">
              <label className={`flex-1 p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                scope === 'all'
                  ? 'border-indigo-600 bg-indigo-50/40 text-slate-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <div>All Filtered Records ({allFilteredDocs.length})</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      Includes current search query and status filters
                    </div>
                  </div>
                </div>
              </label>

              <label className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                !hasSelection
                  ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                  : scope === 'selected'
                  ? 'border-indigo-600 bg-indigo-50/40 text-slate-900 font-semibold cursor-pointer'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="scope"
                    disabled={!hasSelection}
                    checked={scope === 'selected'}
                    onChange={() => setScope('selected')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="text-xs">
                    <div>Selected Records Only ({selectedDocNames.length})</div>
                    <div className="text-[11px] font-normal text-slate-500">
                      {hasSelection ? 'Exports only rows checked in table' : 'No rows currently checked'}
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Column Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                3. Choose Columns ({selectedColCount} of {columns.length} selected)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSelectAllColumns(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Select All
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllColumns(false)}
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
              {columns.map((col) => (
                <label
                  key={col.fieldname}
                  className={`flex items-center gap-2 p-2 rounded-md text-xs cursor-pointer select-none transition-colors ${
                    col.included
                      ? 'bg-white text-slate-900 border border-slate-200 font-medium shadow-2xs'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={col.included}
                    onChange={() => handleToggleColumn(col.fieldname)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="truncate">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Formatting & Layout Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
              4. Document Formatting Options
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">Include Enterprise Header</span>
                  <span className="text-[11px] text-slate-500">
                    Inserts organization title, date, active filters, and operator details.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSummaryTotals}
                  onChange={(e) => setIncludeSummaryTotals(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">Include Summary Totals Row</span>
                  <span className="text-[11px] text-slate-500">
                    Automatically computes total sums for Currency and Numeric columns.
                  </span>
                </div>
              </label>

              {format === 'pdf' && (
                <div className="col-span-1 sm:col-span-2 p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900">PDF Page Orientation</span>
                    <span className="text-[11px] text-slate-500 block">
                      Choose orientation for comfortable table width
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        orientation === 'portrait'
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        orientation === 'landscape'
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Exporting <strong className="text-slate-800 font-mono">{targetDocs.length}</strong> records as{' '}
            <strong className="text-slate-800 font-mono">{previewFilename}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isExporting || selectedColCount === 0}
              onClick={handleExecuteExport}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {exportComplete ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : isExporting ? (
                <>
                  <span className="animate-spin text-sm">⟳</span>
                  <span>Generating {format.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
