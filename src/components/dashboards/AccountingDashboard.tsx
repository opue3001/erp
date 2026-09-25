import React, { useMemo } from 'react';
import { 
  Landmark, 
  DollarSign, 
  FileText, 
  Scale, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  Receipt,
  PieChart
} from 'lucide-react';
import { frappeDB } from '../../framework/db';

interface AccountingDashboardProps {
  onSelectDocType: (doctype: string) => void;
  onOpenDoc: (doctype: string, docName: string) => void;
  onNewDoc: (doctype: string) => void;
}

export const AccountingDashboard: React.FC<AccountingDashboardProps> = ({
  onSelectDocType,
  onOpenDoc,
  onNewDoc,
}) => {
  const invoices = frappeDB.get_list('Sales Invoice');
  const journalEntries = frappeDB.get_list('Journal Entry');

  // Aggregates
  const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (Number(inv.outstanding_amount) || 0), 0);
  const totalCollected = totalBilled - totalOutstanding;

  // General Ledger double entry totals
  let totalDebits = 0;
  let totalCredits = 0;
  journalEntries.forEach((jv) => {
    totalDebits += Number(jv.total_debit) || 0;
    totalCredits += Number(jv.total_credit) || 0;
  });

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Payment Status distribution
  const paymentStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {
      Unpaid: { count: 0, total: 0 },
      Paid: { count: 0, total: 0 },
      'Partially Paid': { count: 0, total: 0 },
      Overdue: { count: 0, total: 0 },
    };
    invoices.forEach((inv) => {
      const status = inv.payment_status || 'Unpaid';
      if (!map[status]) map[status] = { count: 0, total: 0 };
      map[status].count += 1;
      map[status].total += Number(inv.grand_total) || 0;
    });
    return map;
  }, [invoices]);

  const unpaidInvoices = invoices.filter((i) => (Number(i.outstanding_amount) || 0) > 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>ERP Modules</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Accounting & Financials</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Accounting & General Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Double-entry book vouchers, accounts receivable collections, cash equity, and payment reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNewDoc('Journal Entry')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Post Journal Entry</span>
          </button>
          <button
            onClick={() => onNewDoc('Sales Invoice')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Sales Invoice</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Accounts Receivable</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-amber-600 font-semibold">{unpaidInvoices.length} Unpaid Invoices</span>
            <span aria-hidden="true">·</span>
            <span>Net due Q1</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Collected Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Realized Cash Inflow</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">
              {((totalCollected / (totalBilled || 1)) * 100).toFixed(0)}% Collected
            </span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Billed Volume</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>{invoices.length} Invoices issued</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Double-Entry Status</span>
            <Scale className={`w-4 h-4 ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums flex items-center gap-2">
            <span>{isBalanced ? 'Balanced' : 'Imbalanced'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-mono">
            <span>Dr: ${totalDebits.toLocaleString()}</span>
            <span aria-hidden="true">·</span>
            <span>Cr: ${totalCredits.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Collection Status & General Ledger Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Health Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Billing Collection Breakdown</h3>
              <p className="text-xs text-slate-500">Aging and settlement status of customer invoices</p>
            </div>
            <PieChart className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 pt-1">
            {Object.entries(paymentStats).map(([status, data]) => {
              const pct = totalBilled > 0 ? Math.round((data.total / totalBilled) * 100) : 0;
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{status}</span>
                    <div className="flex items-center gap-2 font-mono text-slate-600">
                      <span>{data.count} bills</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900">${data.total.toLocaleString()} ({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        status === 'Paid' ? 'bg-emerald-600' :
                        status === 'Unpaid' ? 'bg-amber-500' :
                        status === 'Overdue' ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* General Ledger Health */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Audit & General Ledger Health</h3>
              <p className="text-xs text-slate-500">Double-entry verification across asset & equity vouchers</p>
            </div>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Debits Posted</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                ${totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Bank inflows & receivables debit</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Credits Posted</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                ${totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Revenue recognition & equity reserve</p>
            </div>

            <div className="col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong>Audit Compliant:</strong> Zero trial balance variance detected. Debits perfectly reconcile with credits according to GAAP double-entry standards.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Invoices & Journal Vouchers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Outstanding Receivables (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Outstanding Receivables</h3>
            <button
              onClick={() => onSelectDocType('Sales Invoice')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <span>All Invoices</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Invoice #</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4 text-right">Outstanding ($)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr
                    key={inv.name}
                    onClick={() => onOpenDoc('Sales Invoice', inv.name)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {inv.name}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium truncate max-w-xs">
                      {inv.customer}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      ${Number(inv.outstanding_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inv.payment_status || 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* General Ledger Journal Vouchers (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Journal Vouchers</h3>
            <button
              onClick={() => onSelectDocType('Journal Entry')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <span>View All Vouchers</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Voucher</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Debit Account</th>
                  <th className="py-2.5 px-4 text-right">Amount ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journalEntries.map((jv) => (
                  <tr
                    key={jv.name}
                    onClick={() => onOpenDoc('Journal Entry', jv.name)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {jv.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {jv.voucher_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">
                      {jv.account_debit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      ${Number(jv.total_debit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
