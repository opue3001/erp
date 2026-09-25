import React from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  ArrowUpRight, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  FolderKanban
} from 'lucide-react';
import { frappeDB } from '../../framework/db';

interface WorkspaceDashboardProps {
  onSelectDocType: (doctype: string) => void;
  onNewDoc: (doctype: string) => void;
  onSelectTab: (tab: string) => void;
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({
  onSelectDocType,
  onNewDoc,
  onSelectTab,
}) => {
  // Compute real aggregates from frappeDB
  const salesOrders = frappeDB.get_list('Sales Order');
  const invoices = frappeDB.get_list('Sales Invoice');
  const items = frappeDB.get_list('Item');
  const employees = frappeDB.get_list('Employee');
  const stockEntries = frappeDB.get_list('Stock Entry');

  const totalSalesVolume = salesOrders.reduce((acc, curr) => acc + (Number(curr.grand_total) || 0), 0);
  const totalOutstanding = invoices.reduce((acc, curr) => acc + (Number(curr.outstanding_amount) || 0), 0);
  
  let totalStockValuation = 0;
  let lowStockCount = 0;
  items.forEach((item) => {
    const qty = Number(item.total_qty) || 0;
    const rate = Number(item.valuation_rate) || 0;
    totalStockValuation += qty * rate;
    if (qty <= (item.reorder_level || 20)) {
      lowStockCount++;
    }
  });

  // Recent transactions list
  const recentOrders = salesOrders.slice(0, 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Enterprise Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time business operations powered by Python & JavaScript Database Abstraction Layer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNewDoc('Sales Order')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sales Order</span>
          </button>
          <button
            onClick={() => onSelectTab('rest_api')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span>REST API Workbench</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards (Single-Elevation, tabular figures, clickable to module dashboards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onSelectTab('dashboard_sales')}
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Gross Sales Volume</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalSalesVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{salesOrders.length} orders recorded</span>
            <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Sales Hub →
            </span>
          </div>
        </div>

        <div 
          onClick={() => onSelectTab('dashboard_accounting')}
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-amber-600 transition-colors">Accounts Receivable</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{invoices.length} invoices issued</span>
            <span className="text-amber-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Finance Hub →
            </span>
          </div>
        </div>

        <div 
          onClick={() => onSelectTab('dashboard_stock')}
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-sky-600 transition-colors">Inventory Valuation</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalStockValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>{items.length} SKUs listed</span>
            <span className="text-sky-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Stock Hub →
            </span>
          </div>
        </div>

        <div 
          onClick={() => onSelectTab('dashboard_hr')}
          className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-indigo-600 transition-colors">Active Workforce</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {employees.length} Staff
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
            <span>4 departments</span>
            <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              HR Hub →
            </span>
          </div>
        </div>
      </div>

      {/* Module Executive Dashboards Quick Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Departmental Operational Dashboards
            </h2>
            <p className="text-xs text-slate-500">
              Dedicated intelligence hubs with deep metrics, trend breakdowns, and ledger journals for each functional module.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-mono">
            6 Modules Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <button
            onClick={() => onSelectTab('dashboard_sales')}
            className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-950">Sales & CRM</div>
            <div className="text-[11px] text-slate-500 mt-1">Territory revenue & orders</div>
          </button>

          <button
            onClick={() => onSelectTab('dashboard_stock')}
            className="p-4 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-sky-600 text-white shadow-xs">
                <Package className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-sky-400 group-hover:text-sky-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-sky-950">Stock & Inventory</div>
            <div className="text-[11px] text-slate-500 mt-1">Valuations & movements</div>
          </button>

          <button
            onClick={() => onSelectTab('dashboard_accounting')}
            className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-amber-600 text-white shadow-xs">
                <FileText className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:text-amber-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-amber-950">Finance & Books</div>
            <div className="text-[11px] text-slate-500 mt-1">Ledgers & receivables</div>
          </button>

          <button
            onClick={() => onSelectTab('dashboard_hr')}
            className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">Human Resources</div>
            <div className="text-[11px] text-slate-500 mt-1">Staff directory & payroll</div>
          </button>

          <button
            onClick={() => onSelectTab('project_detail')}
            className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                <FolderKanban className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-400 group-hover:text-blue-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-950">Project & Delivery</div>
            <div className="text-[11px] text-slate-500 mt-1">Tasks, Gantt & Timesheets</div>
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Transactions & Quick Launchpads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main 2 Cols: Recent Sales Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Sales Transactions</h3>
              <p className="text-xs text-slate-500">Live operational ledger stream</p>
            </div>
            <button
              onClick={() => onSelectDocType('Sales Order')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Document ID</th>
                  <th className="py-2.5 px-4 font-semibold">Customer</th>
                  <th className="py-2.5 px-4 font-semibold">Date</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Grand Total</th>
                  <th className="py-2.5 px-4 font-semibold">Workflow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((so) => (
                  <tr key={so.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {so.name}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {so.customer}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono tabular-nums">
                      {so.transaction_date}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                      ${Number(so.grand_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-600 font-medium">
                        {so.workflow_state || (so.docstatus === 1 ? 'Submitted' : 'Draft')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 1 Col: Quick Module Launchers & Framework Status */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Framework Capabilities</h3>
            <div className="space-y-2">
              <button
                onClick={() => onSelectTab('schema_builder')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">DocType Schema Architect</div>
                  <div className="text-[11px] text-slate-500">Design custom models & fields</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onSelectTab('rest_api')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">REST API Explorer</div>
                  <div className="text-[11px] text-slate-500">Test resource endpoints & cURL</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onSelectTab('python_console')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">Python & JS ORM Console</div>
                  <div className="text-[11px] text-slate-500">Interactive live query sandbox</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => onSelectTab('vue_ui')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-900">Vue UI Component Showcase</div>
                  <div className="text-[11px] text-slate-500">Interactive desk widgets & code</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Quick DocType Summary Cards */}
          <div className="bg-slate-900 text-white rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              System Architecture Note
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every business transaction conforms to declarative DocType metadata. Modifying schema fields instantly updates the UI forms, REST routes, and Python ORM definitions.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Framework Engine</span>
              <span className="font-mono text-emerald-400 font-semibold">Active & Synced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
