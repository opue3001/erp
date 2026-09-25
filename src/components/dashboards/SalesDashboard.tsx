import React, { useMemo } from 'react';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  Globe, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { frappeDB } from '../../framework/db';

interface SalesDashboardProps {
  onSelectDocType: (doctype: string) => void;
  onOpenDoc: (doctype: string, docName: string) => void;
  onNewDoc: (doctype: string) => void;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  onSelectDocType,
  onOpenDoc,
  onNewDoc,
}) => {
  const salesOrders = frappeDB.get_list('Sales Order');
  const customers = frappeDB.get_list('Customer');
  const invoices = frappeDB.get_list('Sales Invoice');

  // Aggregates
  const totalRevenue = salesOrders.reduce((sum, so) => sum + (Number(so.grand_total) || 0), 0);
  const submittedOrders = salesOrders.filter((so) => so.docstatus === 1);
  const draftOrders = salesOrders.filter((so) => so.docstatus === 0);
  const avgOrderValue = salesOrders.length > 0 ? totalRevenue / salesOrders.length : 0;

  // Revenue by Territory calculation
  const territoryStats = useMemo(() => {
    const map: Record<string, { count: number; totalCredit: number }> = {};
    customers.forEach((c) => {
      const t = c.territory || 'Other';
      if (!map[t]) map[t] = { count: 0, totalCredit: 0 };
      map[t].count += 1;
      map[t].totalCredit += Number(c.credit_limit) || 0;
    });
    return Object.entries(map).map(([territory, data]) => ({
      territory,
      ...data,
    }));
  }, [customers]);

  const maxTerritoryCredit = Math.max(...territoryStats.map((t) => t.totalCredit), 1);

  // Workflow distribution
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Draft: 0,
      Submitted: 0,
      Completed: 0,
      Cancelled: 0,
    };
    salesOrders.forEach((so) => {
      const state = so.workflow_state || (so.docstatus === 1 ? 'Submitted' : 'Draft');
      counts[state] = (counts[state] || 0) + 1;
    });
    return counts;
  }, [salesOrders]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>ERP Modules</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Sales & CRM</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sales & CRM Intelligence Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Commercial pipeline, client credit limits, order fulfillment, and revenue realization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNewDoc('Customer')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={() => onNewDoc('Sales Order')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sales Order</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Gross Sales Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-emerald-600 font-semibold font-mono">{submittedOrders.length} Confirmed</span>
            <span aria-hidden="true">·</span>
            <span>{draftOrders.length} In Draft</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Client Accounts</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {customers.length} Accounts
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>{territoryStats.length} Global Territories</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-700 font-medium">100% Active</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Average Deal Size</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${avgOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Across {salesOrders.length} contracts</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Sales Invoiced Ratio</span>
            <FileText className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {invoices.length} of {salesOrders.length} Billed
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Conversion Rate: <strong>{((invoices.length / (salesOrders.length || 1)) * 100).toFixed(0)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Territory Distribution & Pipeline Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Territory Exposure */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Territory Distribution</h3>
              <p className="text-xs text-slate-500">Commercial credit exposure and client concentration</p>
            </div>
            <Globe className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 pt-1">
            {territoryStats.map((t) => {
              const pct = Math.round((t.totalCredit / maxTerritoryCredit) * 100);
              return (
                <div key={t.territory} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{t.territory}</span>
                    <div className="flex items-center gap-2 font-mono text-slate-600">
                      <span>{t.count} clients</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900">${t.totalCredit.toLocaleString()} limit</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline & Order Fulfillment Stages */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Order Lifecycle Status</h3>
              <p className="text-xs text-slate-500">Contract stages from draft proposal to completion</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Submitted & Validated</div>
              <div className="text-2xl font-bold text-emerald-700 font-mono mt-1">
                {statusCounts['Submitted']}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Legally binding, reserved inventory</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Draft Proposals</div>
              <div className="text-2xl font-bold text-slate-700 font-mono mt-1">
                {statusCounts['Draft']}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting client signature / terms</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Completed Deliveries</div>
              <div className="text-2xl font-bold text-indigo-700 font-mono mt-1">
                {statusCounts['Completed']}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Goods received and reconciled</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Cancelled</div>
              <div className="text-2xl font-bold text-slate-400 font-mono mt-1">
                {statusCounts['Cancelled']}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Voided prior to dispatch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Registry & Recent Orders Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Accounts Overview (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Key Customer Accounts</h3>
            <button
              onClick={() => onSelectDocType('Customer')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {customers.map((c) => (
              <div
                key={c.name}
                onClick={() => onOpenDoc('Customer', c.name)}
                className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{c.customer_name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {c.name} · {c.territory} ({c.customer_type})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    ${Number(c.credit_limit || 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales Contracts (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Sales Orders</h3>
            <button
              onClick={() => onSelectDocType('Sales Order')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Order ID</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4 text-right">Amount ($)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesOrders.map((so) => (
                  <tr
                    key={so.name}
                    onClick={() => onOpenDoc('Sales Order', so.name)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {so.name}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium truncate max-w-xs">
                      {so.customer}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      ${Number(so.grand_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        so.docstatus === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {so.workflow_state || (so.docstatus === 1 ? 'Submitted' : 'Draft')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
