import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Landmark, 
  Users, 
  FileCode2, 
  Globe2, 
  Terminal, 
  Palette, 
  ShieldCheck,
  Plus,
  BarChart3,
  Cpu,
  FolderKanban,
  CheckSquare,
  Clock
} from 'lucide-react';
import { DocTypeMeta } from '../../types/erp';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  docTypes: DocTypeMeta[];
  onNewDoc: (doctype: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  docTypes,
  onNewDoc,
}) => {
  const salesDocTypes = docTypes.filter((d) => d.module === 'Sales');
  const stockDocTypes = docTypes.filter((d) => d.module === 'Stock');
  const accountingDocTypes = docTypes.filter((d) => d.module === 'Accounting');
  const hrDocTypes = docTypes.filter((d) => d.module === 'HR');
  const projectDocTypes = docTypes.filter((d) => d.module === 'Projects');
  const customDocTypes = docTypes.filter((d) => d.module === 'Custom');

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Enterprise Desk
          </h2>
          <p className="text-[11px] text-slate-500">Framework Engine v2.4</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Core Workspace */}
        <div>
          <button
            onClick={() => onSelectTab('workspace')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'workspace'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-slate-300" />
            <span>Workspace Overview</span>
          </button>
        </div>

        {/* Modules: Sales */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <button
              onClick={() => onSelectTab('dashboard_sales')}
              className="text-[11px] font-semibold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors text-left"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sales & CRM</span>
            </button>
            <span className="text-[10px] text-slate-600 font-mono">Hub</span>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectTab('dashboard_sales')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors mb-1 ${
                activeTab === 'dashboard_sales'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60 font-medium'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Sales Dashboard</span>
            </button>
            {salesDocTypes.map((dt) => (
              <div key={dt.name} className="flex items-center group">
                <button
                  onClick={() => onSelectTab(`doctype_${dt.name}`)}
                  className={`flex-1 text-left px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                    activeTab === `doctype_${dt.name}`
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {dt.name}
                </button>
                <button
                  onClick={() => onNewDoc(dt.name)}
                  title={`New ${dt.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modules: Stock */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <button
              onClick={() => onSelectTab('dashboard_stock')}
              className="text-[11px] font-semibold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors text-left"
            >
              <Package className="w-3.5 h-3.5 text-sky-400" />
              <span>Stock & Inventory</span>
            </button>
            <span className="text-[10px] text-slate-600 font-mono">Hub</span>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectTab('dashboard_stock')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors mb-1 ${
                activeTab === 'dashboard_stock'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-sky-400 hover:text-sky-300 hover:bg-slate-800/60 font-medium'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Stock Dashboard</span>
            </button>
            {stockDocTypes.map((dt) => (
              <div key={dt.name} className="flex items-center group">
                <button
                  onClick={() => onSelectTab(`doctype_${dt.name}`)}
                  className={`flex-1 text-left px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                    activeTab === `doctype_${dt.name}`
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {dt.name}
                </button>
                <button
                  onClick={() => onNewDoc(dt.name)}
                  title={`New ${dt.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modules: Accounting */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <button
              onClick={() => onSelectTab('dashboard_accounting')}
              className="text-[11px] font-semibold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors text-left"
            >
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              <span>Accounting & Books</span>
            </button>
            <span className="text-[10px] text-slate-600 font-mono">Hub</span>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectTab('dashboard_accounting')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors mb-1 ${
                activeTab === 'dashboard_accounting'
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/60 font-medium'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Finance Dashboard</span>
            </button>
            {accountingDocTypes.map((dt) => (
              <div key={dt.name} className="flex items-center group">
                <button
                  onClick={() => onSelectTab(`doctype_${dt.name}`)}
                  className={`flex-1 text-left px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                    activeTab === `doctype_${dt.name}`
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {dt.name}
                </button>
                <button
                  onClick={() => onNewDoc(dt.name)}
                  title={`New ${dt.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modules: HR */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <button
              onClick={() => onSelectTab('dashboard_hr')}
              className="text-[11px] font-semibold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors text-left"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Human Resources</span>
            </button>
            <span className="text-[10px] text-slate-600 font-mono">Hub</span>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => onSelectTab('dashboard_hr')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors mb-1 ${
                activeTab === 'dashboard_hr'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60 font-medium'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>HR Dashboard</span>
            </button>
            {hrDocTypes.map((dt) => (
              <div key={dt.name} className="flex items-center group">
                <button
                  onClick={() => onSelectTab(`doctype_${dt.name}`)}
                  className={`flex-1 text-left px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                    activeTab === `doctype_${dt.name}`
                      ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {dt.name}
                </button>
                <button
                  onClick={() => onNewDoc(dt.name)}
                  title={`New ${dt.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modules: Project */}
        <div>
          <div className="px-3 mb-1.5 flex items-center justify-between">
            <button
              onClick={() => onSelectTab('project_detail')}
              className="text-[11px] font-semibold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors text-left"
            >
              <FolderKanban className="w-3.5 h-3.5 text-blue-400" />
              <span>Project</span>
            </button>
            <span className="text-[10px] text-slate-600 font-mono">PM</span>
          </div>

          <div className="space-y-0.5">
            {/* Sub Menu 1: Detail Project */}
            <div className="flex items-center group">
              <button
                onClick={() => onSelectTab('project_detail')}
                className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                  activeTab === 'project_detail' || activeTab === 'dashboard_project'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                <span>Detail Project</span>
              </button>
              <button
                onClick={() => onNewDoc('Project')}
                title="New Project"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub Menu 2: Task */}
            <div className="flex items-center group">
              <button
                onClick={() => onSelectTab('project_tasks')}
                className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                  activeTab === 'project_tasks'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                <span>Task</span>
              </button>
              <button
                onClick={() => onNewDoc('Task')}
                title="New Task"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sub Menu 3: Timesheet */}
            <div className="flex items-center group">
              <button
                onClick={() => onSelectTab('project_timesheets')}
                className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                  activeTab === 'project_timesheets'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 font-medium'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Timesheet</span>
              </button>
              <button
                onClick={() => onNewDoc('Timesheet')}
                title="Log Timesheet"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* DocType raw data views for Project models if needed */}
            {projectDocTypes.map((dt) => (
              <div key={dt.name} className="flex items-center group pl-2">
                <button
                  onClick={() => onSelectTab(`doctype_${dt.name}`)}
                  className={`flex-1 text-left px-3 py-1 rounded-md text-[11px] transition-colors truncate ${
                    activeTab === `doctype_${dt.name}`
                      ? 'bg-blue-600/20 text-blue-300 font-semibold'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  • {dt.name} Table
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom DocTypes if any */}
        {customDocTypes.length > 0 && (
          <div>
            <div className="px-3 mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                Custom Models
              </span>
            </div>
            <div className="space-y-0.5">
              {customDocTypes.map((dt) => (
                <div key={dt.name} className="flex items-center group">
                  <button
                    onClick={() => onSelectTab(`doctype_${dt.name}`)}
                    className={`flex-1 text-left px-3 py-1.5 rounded-md text-xs transition-colors truncate ${
                      activeTab === `doctype_${dt.name}`
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {dt.name}
                  </button>
                  <button
                    onClick={() => onNewDoc(dt.name)}
                    title={`New ${dt.name}`}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Framework Tools */}
        <div className="pt-4 border-t border-slate-800 space-y-1">
          <div className="px-3 mb-1 flex items-center justify-between">
            <button
              onClick={() => onSelectTab('dashboard_framework')}
              className="text-[11px] font-semibold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors text-left"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Framework Engine</span>
            </button>
            <span className="text-[10px] text-slate-600 font-mono">Hub</span>
          </div>

          <button
            onClick={() => onSelectTab('dashboard_framework')}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors mb-1 ${
              activeTab === 'dashboard_framework'
                ? 'bg-purple-600 text-white font-semibold shadow-xs'
                : 'text-purple-400 hover:text-purple-300 hover:bg-slate-800/60 font-medium'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Architecture Hub</span>
          </button>

          <button
            onClick={() => onSelectTab('schema_builder')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'schema_builder'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span>DocType Architect</span>
          </button>

          <button
            onClick={() => onSelectTab('rest_api')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'rest_api'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe2 className="w-4 h-4 text-sky-400" />
            <span>REST API Explorer</span>
          </button>

          <button
            onClick={() => onSelectTab('python_console')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'python_console'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Python & JS Console</span>
          </button>

          <button
            onClick={() => onSelectTab('vue_ui')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'vue_ui'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4 text-teal-400" />
            <span>Vue UI Library</span>
          </button>

          <button
            onClick={() => onSelectTab('permissions')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'permissions'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Permissions (RBAC)</span>
          </button>
        </div>
      </div>

      {/* Database Abstraction Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">Storage Engine</span>
        <span className="font-mono text-slate-300">In-Memory / Local DB</span>
      </div>
    </aside>
  );
};
