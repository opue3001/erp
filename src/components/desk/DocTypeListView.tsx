import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw, 
  ArrowUpDown,
  Lock,
  ChevronRight,
  FileText,
  Table,
  ChevronDown,
  Sliders,
  Check
} from 'lucide-react';
import { DocTypeMeta, BaseDoc, User } from '../../types/erp';
import { frappeDB } from '../../framework/db';
import { frappeAuth } from '../../framework/auth';
import { ExportModal } from './ExportModal';
import { exportTableToCSV, exportTableToPDF } from '../../utils/exportUtils';

interface DocTypeListViewProps {
  meta: DocTypeMeta;
  currentUser: User;
  onOpenDoc: (doctype: string, docName: string) => void;
  onNewDoc: (doctype: string) => void;
}

export const DocTypeListView: React.FC<DocTypeListViewProps> = ({
  meta,
  currentUser,
  onOpenDoc,
  onNewDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [sortField, setSortField] = useState('creation');
  const [sortAsc, setSortAsc] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Global Export State
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check permissions
  const canRead = frappeAuth.hasPermission(meta.name, 'read', currentUser);
  const canCreate = frappeAuth.hasPermission(meta.name, 'create', currentUser);
  const canDelete = frappeAuth.hasPermission(meta.name, 'delete', currentUser);

  // Fetch documents
  const allDocs = useMemo(() => {
    return frappeDB.get_list(meta.name);
  }, [meta.name, refreshKey]);

  // Find status field if exists
  const statusField = meta.fields.find((f) => f.fieldname === 'status' || f.fieldname === 'workflow_state' || f.fieldname === 'payment_status');
  const statusOptions = statusField?.options ? ['All', ...statusField.options.split(',')] : ['All'];

  // Columns for list view: fields marked in_list_view
  const listColumns = useMemo(() => {
    const cols = meta.fields.filter((f) => f.in_list_view);
    if (cols.length === 0) return meta.fields.slice(0, 5);
    return cols;
  }, [meta]);

  // Filter & Sort
  const filteredDocs = useMemo(() => {
    let result = [...allDocs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((doc) => {
        return (
          doc.name.toLowerCase().includes(q) ||
          listColumns.some((col) => String(doc[col.fieldname] || '').toLowerCase().includes(q))
        );
      });
    }

    if (statusFilter !== 'All' && statusField) {
      result = result.filter((doc) => doc[statusField.fieldname] === statusFilter);
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA === valB) return 0;
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;
      return (valA > valB ? 1 : -1) * (sortAsc ? 1 : -1);
    });

    return result;
  }, [allDocs, searchQuery, statusFilter, statusField, listColumns, sortField, sortAsc]);

  const toggleSelectAll = () => {
    if (selectedDocs.length === filteredDocs.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(filteredDocs.map((d) => d.name));
    }
  };

  const toggleSelectDoc = (name: string) => {
    setSelectedDocs((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleBatchDelete = () => {
    if (!canDelete) return;
    try {
      selectedDocs.forEach((name) => {
        frappeDB.delete_doc(meta.name, name);
      });
      setSelectedDocs([]);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleQuickExportCSV = () => {
    const cols = meta.fields.map((f) => ({
      fieldname: f.fieldname,
      label: f.label,
      fieldtype: f.fieldtype,
      included: listColumns.some((lc) => lc.fieldname === f.fieldname),
    }));
    exportTableToCSV(meta, filteredDocs, {
      columns: cols,
      includeMetadata: true,
      includeSummaryTotals: true,
      activeFilter: statusFilter,
      searchQuery: searchQuery,
      userRole: currentUser.role,
    });
    setExportDropdownOpen(false);
  };

  const handleQuickExportPDF = () => {
    const cols = meta.fields.map((f) => ({
      fieldname: f.fieldname,
      label: f.label,
      fieldtype: f.fieldtype,
      included: listColumns.some((lc) => lc.fieldname === f.fieldname),
    }));
    exportTableToPDF(meta, filteredDocs, {
      columns: cols,
      orientation: listColumns.length > 5 ? 'landscape' : 'portrait',
      includeMetadata: true,
      includeSummaryTotals: true,
      activeFilter: statusFilter,
      searchQuery: searchQuery,
      userRole: currentUser.role,
    });
    setExportDropdownOpen(false);
  };

  if (!canRead) {
    return (
      <div className="p-12 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your role <strong className="text-slate-800">{currentUser.role}</strong> does not have permission to view <strong className="text-slate-800">{meta.name}</strong> documents.
        </p>
        <p className="text-xs text-slate-400">
          Switch to an authorized role (e.g. System Manager or relevant department lead) via the top bar user menu to inspect these records.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>{meta.module}</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">{meta.name}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {meta.name} List
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            title="Refresh"
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Global Export Menu */}
          <div className="relative" ref={exportDropdownRef}>
            <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
              <button
                onClick={() => setExportModalOpen(true)}
                title="Configure and Export Table Data"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
              </button>
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                title="Quick Export Options"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border-l border-slate-200 transition-colors cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Export Dropdown */}
            {exportDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Table Export
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Exports {filteredDocs.length} visible records
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleQuickExportPDF}
                    className="w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="p-1 rounded bg-indigo-50 text-indigo-600 mt-0.5 group-hover:bg-indigo-100">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>Download as PDF</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold">.pdf</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Corporate report with letterhead & totals
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleQuickExportCSV}
                    className="w-full px-3 py-2 text-left flex items-start gap-2.5 hover:bg-slate-50 transition-colors group cursor-pointer"
                  >
                    <div className="p-1 rounded bg-emerald-50 text-emerald-600 mt-0.5 group-hover:bg-emerald-100">
                      <Table className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>Download as CSV</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold">.csv</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Raw spreadsheet with UTF-8 BOM
                      </div>
                    </div>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setExportDropdownOpen(false);
                      setExportModalOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center justify-between text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      <span>Custom Export & Columns...</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {selectedDocs.length > 0 && (
            <button
              onClick={() => setExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
              title="Export selected records"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Selected ({selectedDocs.length})</span>
            </button>
          )}

          {selectedDocs.length > 0 && canDelete && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedDocs.length})</span>
            </button>
          )}

          {canCreate ? (
            <button
              onClick={() => onNewDoc(meta.name)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New {meta.name}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 bg-slate-100 rounded-lg border border-slate-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Creation Restricted</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Filter ${meta.name.toLowerCase()} by ID, name or attribute...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-transparent border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>

        {statusField && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            {statusOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === opt
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DataGrid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="w-10 py-2.5 px-4">
                  <input
                    type="checkbox"
                    checked={selectedDocs.length > 0 && selectedDocs.length === filteredDocs.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                </th>
                <th 
                  className="py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-slate-900"
                  onClick={() => {
                    if (sortField === 'name') setSortAsc(!sortAsc);
                    else { setSortField('name'); setSortAsc(true); }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {listColumns.map((col) => {
                  const isNumeric = col.fieldtype === 'Currency' || col.fieldtype === 'Int' || col.fieldtype === 'Float';
                  return (
                    <th
                      key={col.fieldname}
                      className={`py-2.5 px-4 font-semibold cursor-pointer select-none hover:text-slate-900 ${
                        isNumeric ? 'text-right' : 'text-left'
                      }`}
                      onClick={() => {
                        if (sortField === col.fieldname) setSortAsc(!sortAsc);
                        else { setSortField(col.fieldname); setSortAsc(true); }
                      }}
                    >
                      <div className={`flex items-center gap-1 ${isNumeric ? 'justify-end' : 'justify-start'}`}>
                        <span>{col.label}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  );
                })}
                <th className="py-2.5 px-4 font-semibold text-right">Modified</th>
                <th className="w-12 py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={listColumns.length + 4} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">No {meta.name} records found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchQuery ? 'Try clearing your filter or search query.' : `Get started by creating your first ${meta.name}.`}
                    </p>
                    {canCreate && (
                      <button
                        onClick={() => onNewDoc(meta.name)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create {meta.name}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = selectedDocs.includes(doc.name);
                  return (
                    <tr
                      key={doc.name}
                      onClick={() => onOpenDoc(meta.name, doc.name)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td 
                        className="py-3 px-4" 
                        onClick={(e) => { e.stopPropagation(); toggleSelectDoc(doc.name); }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectDoc(doc.name)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {doc.name}
                      </td>
                      {listColumns.map((col) => {
                        const val = doc[col.fieldname];
                        const isNumeric = col.fieldtype === 'Currency' || col.fieldtype === 'Int' || col.fieldtype === 'Float';

                        if (col.fieldtype === 'Currency') {
                          return (
                            <td key={col.fieldname} className="py-3 px-4 text-right font-mono font-medium tabular-nums text-slate-900 whitespace-nowrap">
                              ${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          );
                        }

                        if (col.fieldtype === 'Int' || col.fieldtype === 'Float') {
                          return (
                            <td key={col.fieldname} className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                              {val ?? 0}
                            </td>
                          );
                        }

                        if (col.fieldname === 'status' || col.fieldname === 'workflow_state' || col.fieldname === 'payment_status') {
                          return (
                            <td key={col.fieldname} className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                              {val || 'Draft'}
                            </td>
                          );
                        }

                        return (
                          <td key={col.fieldname} className="py-3 px-4 text-slate-700 truncate max-w-xs">
                            {String(val ?? '—')}
                          </td>
                        );
                      })}
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {doc.modified ? doc.modified.substring(5, 16) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer row with record count */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700 font-mono tabular-nums">{filteredDocs.length}</span> of <span className="font-semibold text-slate-700 font-mono tabular-nums">{allDocs.length}</span> {meta.name} documents
          </div>
          <div className="flex items-center gap-2">
            <span>Module: {meta.module}</span>
            <span aria-hidden="true">·</span>
            <span>Schema: v1.0</span>
          </div>
        </div>
      </div>

      {/* Export Options Modal */}
      {exportModalOpen && (
        <ExportModal
          meta={meta}
          allFilteredDocs={filteredDocs}
          selectedDocNames={selectedDocs}
          userRole={currentUser.role}
          activeFilter={statusFilter}
          searchQuery={searchQuery}
          onClose={() => setExportModalOpen(false)}
        />
      )}
    </div>
  );
};
