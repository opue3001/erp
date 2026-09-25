import React from 'react';
import { 
  FileCode2, 
  Globe2, 
  Terminal, 
  Palette, 
  ShieldCheck, 
  ArrowUpRight, 
  Cpu, 
  Database, 
  Layers, 
  KeyRound, 
  Code2,
  CheckCircle2
} from 'lucide-react';
import { frappeDB } from '../../framework/db';
import { frappeAuth, SYSTEM_USERS } from '../../framework/auth';
import { STANDARD_ENDPOINTS } from '../../framework/apiEngine';

interface FrameworkDashboardProps {
  onSelectTab: (tab: string) => void;
}

export const FrameworkDashboard: React.FC<FrameworkDashboardProps> = ({ onSelectTab }) => {
  const doctypes = frappeDB.get_all_doctypes();
  const currentUser = frappeAuth.getCurrentUser();
  const token = frappeAuth.getAuthToken();

  let totalRecords = 0;
  doctypes.forEach((dt) => {
    totalRecords += frappeDB.get_list(dt.name).length;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Framework Engine</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Developer Command Center</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AetherERP Framework Architecture Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Meta-data driven framework tools, Python & JS database abstraction layer, REST API explorer, and Vue UI library.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Engine v2.4 Live</span>
          </div>
        </div>
      </div>

      {/* Architecture KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Registered DocTypes</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {doctypes.length} Models
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Core & Custom database schemas
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Records in DB</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalRecords} Documents
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Synchronized with local persistence
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">REST Endpoints</span>
            <Globe2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {STANDARD_ENDPOINTS.length} Routes
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Resource CRUD & Whitelisted RPC
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Security Roles (RBAC)</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {SYSTEM_USERS.length} Roles
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Granular DocPerm matrix
          </div>
        </div>
      </div>

      {/* Tool Launchpads Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Framework Developer Tools
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* DocType Schema Architect */}
          <div 
            onClick={() => onSelectTab('schema_builder')}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  DocType Schema Architect
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Design custom models and field types. Automatically generates Python Document controller classes and JSON metadata schemas.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-indigo-600">
              <span>Open Schema Builder</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* REST API Explorer */}
          <div 
            onClick={() => onSelectTab('rest_api')}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  REST API Explorer & Workbench
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Test live resource GET, POST, PUT, DELETE endpoints and whitelisted RPC methods with authorization headers and cURL snippets.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-indigo-600">
              <span>Open API Explorer</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Python & JS Console */}
          <div 
            onClick={() => onSelectTab('python_console')}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Python ORM & JS DBAL Console
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Interactive script execution sandbox simulating Frappe Python ORM methods (<code className="font-mono text-emerald-600 font-semibold">frappe.get_doc</code>, <code className="font-mono text-emerald-600 font-semibold">doc.submit</code>) with live output.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-indigo-600">
              <span>Launch Terminal Console</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Vue UI Library */}
          <div 
            onClick={() => onSelectTab('vue_ui')}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Vue UI Component Library
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Modern Vue 3 Single File Component (SFC) building blocks designed for reactive enterprise applications and DataGrids.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-indigo-600">
              <span>View Component Catalog</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Permissions Matrix */}
          <div 
            onClick={() => onSelectTab('permissions')}
            className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Role-Based Access Control (RBAC)
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage Read, Write, Create, Delete, Submit, and Cancel permissions across all user roles and DocType models.
                </p>
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-indigo-600">
              <span>Manage Role Matrix</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
