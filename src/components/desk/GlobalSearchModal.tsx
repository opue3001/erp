import React, { useState, useEffect } from 'react';
import { Search, X, ChevronRight, FileText, ArrowRight } from 'lucide-react';
import { frappeDB } from '../../framework/db';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDoc: (doctype: string, docName: string) => void;
  onSelectTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectDoc,
  onSelectTab,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const doctypes = frappeDB.get_all_doctypes();

  const DASHBOARDS = [
    { title: 'Workspace Overview', tab: 'workspace', category: 'Executive Dashboard' },
    { title: 'Sales & CRM Dashboard', tab: 'dashboard_sales', category: 'Sales Module' },
    { title: 'Stock & Inventory Dashboard', tab: 'dashboard_stock', category: 'Stock Module' },
    { title: 'Finance & Books Dashboard', tab: 'dashboard_accounting', category: 'Accounts Module' },
    { title: 'Human Resources Dashboard', tab: 'dashboard_hr', category: 'HR Module' },
    { title: 'Architecture Hub', tab: 'dashboard_framework', category: 'Framework Hub' },
    { title: 'DocType Schema Architect', tab: 'schema_builder', category: 'Framework Tool' },
    { title: 'REST API Explorer', tab: 'rest_api', category: 'Developer Tool' },
    { title: 'Python & JS Console', tab: 'python_console', category: 'Developer Tool' },
    { title: 'Vue UI Component Showcase', tab: 'vue_ui', category: 'UI Library' },
  ];

  // Search across documents & dashboards
  const dashboardMatches = query.trim().length >= 1 
    ? DASHBOARDS.filter(d => d.title.toLowerCase().includes(query.toLowerCase()) || d.category.toLowerCase().includes(query.toLowerCase()))
    : [];

  const results: { doctype: string; name: string; title: string; subtitle?: string }[] = [];
  if (query.trim().length >= 1) {
    const q = query.toLowerCase();
    doctypes.forEach((dt) => {
      const docs = frappeDB.get_list(dt.name);
      docs.forEach((d) => {
        const titleVal = String(d[dt.title_field || 'name'] || d.name);
        const nameVal = d.name;
        if (nameVal.toLowerCase().includes(q) || titleVal.toLowerCase().includes(q)) {
          results.push({
            doctype: dt.name,
            name: d.name,
            title: titleVal,
            subtitle: `${dt.name} · ${dt.module}`,
          });
        }
      });
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-24 p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200">
          <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents, customers, invoices, items..."
            className="w-full text-sm text-slate-800 focus:outline-none bg-transparent"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results / Navigation links */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim().length === 0 ? (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Department Dashboards
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => { onSelectTab('workspace'); onClose(); }}
                    className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>Master Workspace</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { onSelectTab('dashboard_sales'); onClose(); }}
                    className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>Sales & CRM</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { onSelectTab('dashboard_stock'); onClose(); }}
                    className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>Stock & Inventory</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { onSelectTab('dashboard_accounting'); onClose(); }}
                    className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>Finance & Books</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { onSelectTab('dashboard_hr'); onClose(); }}
                    className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>Human Resources</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { onSelectTab('dashboard_framework'); onClose(); }}
                    className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>Architecture Hub</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Framework Engines
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => { onSelectTab('schema_builder'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>DocType Schema Architect</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { onSelectTab('rest_api'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>REST API Explorer</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => { onSelectTab('python_console'); onClose(); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between"
                  >
                    <span>Python & JS Console</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          ) : dashboardMatches.length === 0 && results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching dashboards or ERP documents found for &quot;{query}&quot;.
            </div>
          ) : (
            <div className="space-y-2">
              {dashboardMatches.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Dashboards & Hubs
                  </div>
                  {dashboardMatches.map((d) => (
                    <button
                      key={d.tab}
                      onClick={() => {
                        onSelectTab(d.tab);
                        onClose();
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-100 rounded-lg flex items-center justify-between group transition-colors bg-slate-50/70"
                    >
                      <div className="flex items-center gap-2.5">
                        <ArrowRight className="w-4 h-4 text-indigo-500" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{d.title}</div>
                          <div className="text-[11px] text-slate-500">{d.category}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                        Open
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-1">
                  <div className="px-3 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ERP Documents
                  </div>
                  {results.slice(0, 8).map((r) => (
                    <button
                      key={`${r.doctype}_${r.name}`}
                      onClick={() => {
                        onSelectDoc(r.doctype, r.name);
                        onClose();
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{r.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{r.name} · {r.subtitle}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
