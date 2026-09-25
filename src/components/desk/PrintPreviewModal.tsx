import React from 'react';
import { X, Printer } from 'lucide-react';
import { BaseDoc } from '../../types/erp';

interface PrintPreviewModalProps {
  doc: BaseDoc;
  onClose: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ doc, onClose }) => {
  const isInvoice = doc.doctype === 'Sales Invoice';
  const isOrder = doc.doctype === 'Sales Order';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Official Print Voucher</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-mono text-slate-600">{doc.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Letterhead Paper */}
        <div className="p-8 overflow-y-auto flex-1 bg-white font-sans text-slate-800 space-y-6">
          {/* Header & Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-slate-900 text-white rounded font-mono font-bold flex items-center justify-center text-sm">
                  Æ
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Aether Technologies ERP Corp
                </h1>
              </div>
              <p className="text-xs text-slate-500">
                100 Innovation Boulevard, Suite 400 · Silicon Valley, CA 94025
              </p>
              <p className="text-xs text-slate-500">
                Tax ID: US-EIN-98-3419082 · billing@aether-erp.internal
              </p>
            </div>

            <div className="text-right">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
                {doc.doctype}
              </h2>
              <p className="text-xs font-mono font-semibold text-slate-700 mt-1">
                {doc.name}
              </p>
              <p className="text-xs text-slate-500 font-mono tabular-nums">
                Date: {doc.transaction_date || doc.posting_date || doc.creation?.substring(0, 10)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Status: {doc.docstatus === 1 ? 'Approved / Submitted' : 'Draft'}
              </p>
            </div>
          </div>

          {/* Party & Terms */}
          <div className="grid grid-cols-2 gap-8 text-xs py-2">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Billed / Issued To:
              </span>
              <div className="mt-1 font-bold text-sm text-slate-900">
                {doc.customer || doc.employee_name || 'Standard Client Account'}
              </div>
              {doc.email_id && <div className="text-slate-600">{doc.email_id}</div>}
              {doc.phone && <div className="text-slate-600">{doc.phone}</div>}
            </div>

            <div className="text-right space-y-1">
              {doc.due_date && (
                <div>
                  <span className="text-slate-500">Payment Due: </span>
                  <span className="font-mono font-semibold text-slate-800">{doc.due_date}</span>
                </div>
              )}
              {doc.delivery_date && (
                <div>
                  <span className="text-slate-500">Delivery Date: </span>
                  <span className="font-mono font-semibold text-slate-800">{doc.delivery_date}</span>
                </div>
              )}
              {doc.currency && (
                <div>
                  <span className="text-slate-500">Billing Currency: </span>
                  <span className="font-semibold text-slate-800">{doc.currency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Table / Summary of charges */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Rate</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 text-slate-800 font-medium">
                    {doc.items_summary || doc.purpose || `${doc.doctype} Service Reference`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                    {doc.qty || 1}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                    ${Number(doc.net_total || doc.grand_total || doc.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                    ${Number(doc.net_total || doc.grand_total || doc.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              {doc.net_total && (
                <div className="flex justify-between text-slate-600">
                  <span>Net Amount:</span>
                  <span className="font-mono tabular-nums">${Number(doc.net_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {doc.tax_amount && (
                <div className="flex justify-between text-slate-600">
                  <span>State Tax (8%):</span>
                  <span className="font-mono tabular-nums">${Number(doc.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                <span>Grand Total:</span>
                <span className="font-mono tabular-nums">
                  ${Number(doc.grand_total || doc.total_debit || doc.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Authorization signature line */}
          <div className="pt-12 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <p className="mt-1 leading-relaxed text-[11px]">
                Standard Net 30 payment terms apply. Goods inspected under ISO 9001 guidelines prior to dispatch.
              </p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-slate-400 w-48 ml-auto mb-1"></div>
              <p className="font-semibold text-slate-800">Authorized Officer</p>
              <p className="text-[11px] text-slate-400">Aether Enterprise Financial Operations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
