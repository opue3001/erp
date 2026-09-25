import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Check, 
  Ban, 
  Trash2, 
  Printer, 
  Clock, 
  User as UserIcon, 
  AlertCircle,
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { DocTypeMeta, BaseDoc, User } from '../../types/erp';
import { frappeDB } from '../../framework/db';
import { frappeAuth } from '../../framework/auth';

interface DocTypeFormModalProps {
  meta: DocTypeMeta;
  docName: string | null; // null means creating new
  currentUser: User;
  onClose: () => void;
  onSaved: (doc: BaseDoc) => void;
  onOpenPrintPreview: (doc: BaseDoc) => void;
}

export const DocTypeFormModal: React.FC<DocTypeFormModalProps> = ({
  meta,
  docName,
  currentUser,
  onClose,
  onSaved,
  onOpenPrintPreview,
}) => {
  const isNew = !docName;

  // Initialize form state
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    if (!isNew && docName) {
      const existing = frappeDB.get_doc(meta.name, docName);
      if (existing) return { ...existing };
    }

    // Default initialization
    const initial: Record<string, any> = {
      doctype: meta.name,
      docstatus: 0,
    };
    meta.fields.forEach((f) => {
      if (f.default !== undefined) {
        initial[f.fieldname] = f.default;
      } else if (f.fieldtype === 'Date') {
        initial[f.fieldname] = new Date().toISOString().substring(0, 10);
      } else if (f.fieldtype === 'Currency' || f.fieldtype === 'Int' || f.fieldtype === 'Float') {
        initial[f.fieldname] = 0;
      } else {
        initial[f.fieldname] = '';
      }
    });

    if (meta.name === 'Sales Order') {
      initial.workflow_state = 'Draft';
      initial.net_total = 12000;
      initial.tax_amount = 960;
      initial.grand_total = 12960;
      initial.customer = 'Helios Semiconductor Corp';
      initial.items_summary = 'Standard Enterprise Package';
    }

    return initial;
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto calculate tax for Sales Order when net_total changes
  const handleNetTotalChange = (val: number) => {
    const tax = Math.round(val * 0.08 * 100) / 100;
    const grand = Math.round((val + tax) * 100) / 100;
    setFormData((prev) => ({
      ...prev,
      net_total: val,
      tax_amount: tax,
      grand_total: grand,
    }));
  };

  const handleFieldChange = (fieldname: string, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldname]: val,
    }));
  };

  const isSubmitted = formData.docstatus === 1;
  const isCancelled = formData.docstatus === 2;

  // Permissions
  const canWrite = frappeAuth.hasPermission(meta.name, 'write', currentUser);
  const canSubmit = frappeAuth.hasPermission(meta.name, 'submit', currentUser);
  const canCancel = frappeAuth.hasPermission(meta.name, 'cancel', currentUser);
  const canDelete = frappeAuth.hasPermission(meta.name, 'delete', currentUser);

  const handleSave = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (isNew) {
        const created = frappeDB.insert(formData as any, currentUser.full_name);
        setFormData(created);
        setSuccessMessage(`Document ${created.name} created successfully.`);
        onSaved(created);
      } else {
        const saved = frappeDB.save(formData as any, currentUser.full_name);
        setFormData(saved);
        setSuccessMessage(`Changes saved successfully.`);
        onSaved(saved);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save document');
    }
  };

  const handleSubmit = () => {
    if (!formData.name) return;
    setErrorMessage(null);
    try {
      const submitted = frappeDB.submit(meta.name, formData.name);
      setFormData(submitted);
      setSuccessMessage(`Document ${submitted.name} submitted successfully.`);
      onSaved(submitted);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleCancel = () => {
    if (!formData.name) return;
    setErrorMessage(null);
    try {
      const cancelled = frappeDB.cancel(meta.name, formData.name);
      setFormData(cancelled);
      setSuccessMessage(`Document ${cancelled.name} cancelled.`);
      onSaved(cancelled);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDelete = () => {
    if (!formData.name) return;
    if (confirm(`Are you sure you want to delete ${formData.name}?`)) {
      try {
        frappeDB.delete_doc(meta.name, formData.name);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{meta.module}</span>
                <span aria-hidden="true">/</span>
                <span>{meta.name}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {isNew ? `New ${meta.name}` : formData.name}
              </h2>
            </div>

            {/* Workflow state label */}
            {!isNew && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                isSubmitted ? 'bg-emerald-100 text-emerald-800' :
                isCancelled ? 'bg-rose-100 text-rose-800' :
                'bg-slate-200 text-slate-700'
              }`}>
                {isSubmitted ? 'Submitted' : isCancelled ? 'Cancelled' : 'Draft'}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                onClick={() => onOpenPrintPreview(formData as BaseDoc)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                title="Print Preview / Letterhead"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            )}

            {!isSubmitted && !isCancelled && canWrite && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            )}

            {meta.is_submittable && !isSubmitted && !isCancelled && !isNew && canSubmit && (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            )}

            {meta.is_submittable && isSubmitted && canCancel && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Doc</span>
              </button>
            )}

            {!isSubmitted && !isNew && canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meta.fields.map((field) => {
              const isReadOnly = field.read_only || isSubmitted || isCancelled;

              if (field.fieldtype === 'Select') {
                const options = (field.options || '').split(',');
                return (
                  <div key={field.fieldname} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {field.label} {field.reqd && <span className="text-rose-500">*</span>}
                    </label>
                    <select
                      value={formData[field.fieldname] ?? ''}
                      disabled={isReadOnly}
                      onChange={(e) => handleFieldChange(field.fieldname, e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.fieldtype === 'Currency' || field.fieldtype === 'Float' || field.fieldtype === 'Int') {
                const isNetTotal = field.fieldname === 'net_total';
                return (
                  <div key={field.fieldname} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {field.label} {field.reqd && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="number"
                      step={field.fieldtype === 'Int' ? '1' : '0.01'}
                      value={formData[field.fieldname] ?? 0}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value) || 0;
                        if (isNetTotal) {
                          handleNetTotalChange(num);
                        } else {
                          handleFieldChange(field.fieldname, num);
                        }
                      }}
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                );
              }

              if (field.fieldtype === 'Date') {
                return (
                  <div key={field.fieldname} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {field.label} {field.reqd && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={formData[field.fieldname] ?? ''}
                      disabled={isReadOnly}
                      onChange={(e) => handleFieldChange(field.fieldname, e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                );
              }

              if (field.fieldtype === 'Text') {
                return (
                  <div key={field.fieldname} className="col-span-1 md:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {field.label} {field.reqd && <span className="text-rose-500">*</span>}
                    </label>
                    <textarea
                      rows={2}
                      value={formData[field.fieldname] ?? ''}
                      disabled={isReadOnly}
                      onChange={(e) => handleFieldChange(field.fieldname, e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                );
              }

              // Default Data / Link
              return (
                <div key={field.fieldname} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {field.label} {field.reqd && <span className="text-rose-500">*</span>}
                    </label>
                    {field.fieldtype === 'Link' && (
                      <span className="text-[10px] text-slate-400 font-mono">Link: {field.options}</span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData[field.fieldname] ?? ''}
                    disabled={isReadOnly}
                    onChange={(e) => handleFieldChange(field.fieldname, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              );
            })}
          </div>

          {/* Audit metadata section */}
          {!isNew && (
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Owner: <strong>{formData.owner || 'System'}</strong></span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Created: {formData.creation}</span>
                <span aria-hidden="true">·</span>
                <span>Modified: {formData.modified}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
