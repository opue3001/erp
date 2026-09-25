import React, { useState, useMemo } from 'react';
import { 
  X, 
  ChevronDown, 
  Calendar, 
  Printer, 
  CheckCircle2, 
  Plus, 
  Trash2,
  FileText
} from 'lucide-react';
import { frappeDB } from '../../framework/db';
import { TimesheetDoc, ProjectDoc, EmployeeDoc } from '../../types/erp';

export interface TimesheetRowData {
  id: string;
  project: string;
  job_id: string;
  normal: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
  };
  overtime: {
    sun: number;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
  };
}

interface CreateTimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (savedDoc: TimesheetDoc) => void;
}

export const CreateTimesheetModal: React.FC<CreateTimesheetModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  // Top fields state matching the user's uploaded image
  const [employee, setEmployee] = useState('Adi Toto Haryono (105115)');
  const [weekEnding, setWeekEnding] = useState('2026-09-19');
  const [status, setStatus] = useState('In Progress');
  const [job, setJob] = useState('');
  const [position, setPosition] = useState('');
  const [description, setDescription] = useState('Weekly timesheet entry');

  // Rows of project timesheets
  const [rows, setRows] = useState<TimesheetRowData[]>([
    {
      id: 'row-1',
      project: 'Administration',
      job_id: '',
      normal: {
        mon: 0,
        tue: 8,
        wed: 8,
        thu: 8,
        fri: 8,
      },
      overtime: {
        sun: 0,
        mon: 0,
        tue: 0,
        wed: 0,
        thu: 0,
        fri: 0,
        sat: 0,
      },
    },
  ]);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Report preview modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Retrieve projects and employees from DB
  const dbProjects = (frappeDB.get_list('Project') || []) as ProjectDoc[];
  const dbEmployees = (frappeDB.get_list('Employee') || []) as EmployeeDoc[];

  // Merge projects ensuring "Administration" is available
  const availableProjects = useMemo(() => {
    const list = dbProjects.map((p) => p.project_name || p.name);
    if (!list.includes('Administration')) {
      list.unshift('Administration');
    }
    return Array.from(new Set(list));
  }, [dbProjects]);

  // Compute normal hours for a row
  const calculateNormalTotal = (normal: TimesheetRowData['normal']) => {
    return (
      (Number(normal.mon) || 0) +
      (Number(normal.tue) || 0) +
      (Number(normal.wed) || 0) +
      (Number(normal.thu) || 0) +
      (Number(normal.fri) || 0)
    );
  };

  // Compute overtime hours for a row
  const calculateOvertimeTotal = (overtime: TimesheetRowData['overtime']) => {
    return (
      (Number(overtime.sun) || 0) +
      (Number(overtime.mon) || 0) +
      (Number(overtime.tue) || 0) +
      (Number(overtime.wed) || 0) +
      (Number(overtime.thu) || 0) +
      (Number(overtime.fri) || 0) +
      (Number(overtime.sat) || 0)
    );
  };

  // Grand totals across all rows
  const grandTotalNormal = useMemo(() => {
    return rows.reduce((sum, r) => sum + calculateNormalTotal(r.normal), 0);
  }, [rows]);

  const grandTotalOvertime = useMemo(() => {
    return rows.reduce((sum, r) => sum + calculateOvertimeTotal(r.overtime), 0);
  }, [rows]);

  // Handlers for updating hours
  const updateNormalHours = (
    rowId: string,
    day: keyof TimesheetRowData['normal'],
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, normal: { ...r.normal, [day]: num } } : r
      )
    );
  };

  const updateOvertimeHours = (
    rowId: string,
    day: keyof TimesheetRowData['overtime'],
    val: string
  ) => {
    const num = parseFloat(val) || 0;
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, overtime: { ...r.overtime, [day]: num } } : r
      )
    );
  };

  const updateRowField = (
    rowId: string,
    field: 'project' | 'job_id',
    val: string
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [field]: val } : r))
    );
  };

  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    setRows((prev) => [
      ...prev,
      {
        id: newId,
        project: availableProjects[0] || 'Administration',
        job_id: '',
        normal: { mon: 0, tue: 8, wed: 8, thu: 8, fri: 8 },
        overtime: { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 },
      },
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  // Save logic
  const saveTimesheetRecord = (): TimesheetDoc => {
    const firstRow = rows[0];
    const totalNormal = calculateNormalTotal(firstRow.normal);
    const totalOvertime = calculateOvertimeTotal(firstRow.overtime);
    const totalHours = totalNormal + totalOvertime;

    const newDoc = frappeDB.insert({
      doctype: 'Timesheet',
      employee,
      project: firstRow.project,
      start_date: weekEnding,
      hours: totalHours > 0 ? totalHours : 32,
      is_billable: true,
      billing_rate: 95,
      total_billed_amount: (totalHours > 0 ? totalHours : 32) * 95,
      activity_type: firstRow.project === 'Administration' ? 'Internal Operations' : 'Project Delivery',
      notes: description,
      week_ending: weekEnding,
      status,
      job,
      position,
      job_id: firstRow.job_id,
      total_normal_hours: totalNormal,
      total_overtime_hours: totalOvertime,
      normal_hours: firstRow.normal,
      overtime_hours: firstRow.overtime,
      description,
    } as any) as TimesheetDoc;

    return newDoc;
  };

  const handleSave = () => {
    const saved = saveTimesheetRecord();
    if (onSaved) onSaved(saved);
    onClose();
  };

  const handleSaveAndAddAnother = () => {
    const saved = saveTimesheetRecord();
    if (onSaved) onSaved(saved);

    // Reset form for next entry
    setJob('');
    setPosition('');
    setDescription('Weekly timesheet entry');
    setRows([
      {
        id: `row-${Date.now()}`,
        project: 'Administration',
        job_id: '',
        normal: { mon: 0, tue: 8, wed: 8, thu: 8, fri: 8 },
        overtime: { sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0 },
      },
    ]);

    setToastMessage('Timesheet entry saved successfully! Ready for the next record.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header matching screenshot */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-xl font-bold text-[#1a6894] tracking-tight">
            Create Timesheet
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-md"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast notification if Save & Add Another was pressed */}
        {toastMessage && (
          <div className="mx-6 mb-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-md flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="px-6 pb-6 space-y-4 text-slate-800">
          
          {/* Top Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
            {/* Employee * */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Employee <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  value={employee}
                  onChange={(e) => setEmployee(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#1a6894] pr-8 shadow-2xs"
                >
                  <option value="Adi Toto Haryono (105115)">Adi Toto Haryono (105115)</option>
                  {dbEmployees
                    .filter((e) => e.employee_name !== 'Adi Toto Haryono (105115)')
                    .map((emp) => (
                      <option key={emp.name} value={emp.employee_name}>
                        {emp.employee_name}
                      </option>
                    ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Week Ending * */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Week Ending <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={weekEnding}
                  onChange={(e) => setWeekEnding(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 font-sans focus:outline-none focus:border-[#1a6894] shadow-2xs"
                />
              </div>
            </div>

            {/* Status * */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Status <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full appearance-none px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#1a6894] pr-8 shadow-2xs"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Job */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Job
              </label>
              <input
                type="text"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#1a6894] shadow-2xs"
              />
            </div>

            {/* Position (left column matching screenshot) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#1a6894] shadow-2xs"
              />
            </div>
          </div>

          {/* Table Container with petrol blue / teal header `#18648e` */}
          <div className="pt-2">
            <div className="overflow-x-auto border border-[#18648e] rounded-sm shadow-xs">
              <table className="w-full border-collapse text-xs min-w-[900px]">
                {/* 2-Tier Header */}
                <thead>
                  <tr className="bg-[#18648e] text-white font-bold divide-x divide-[#125073]">
                    <th rowSpan={2} className="px-3 py-2 text-center text-xs font-bold w-[18%]">
                      Project
                    </th>
                    <th rowSpan={2} className="px-2 py-2 text-center text-xs font-bold w-[10%]">
                      Job ID
                    </th>
                    <th rowSpan={2} className="px-2 py-2 text-center text-xs font-bold w-[11%]">
                      Total Normal Hours
                    </th>
                    <th rowSpan={2} className="px-2 py-2 text-center text-xs font-bold w-[11%]">
                      Total Overtime Hours
                    </th>
                    <th colSpan={5} className="py-1 text-center text-xs font-bold border-b border-[#125073]">
                      Normal Hours This Week
                    </th>
                    <th colSpan={7} className="py-1 text-center text-xs font-bold border-b border-[#125073]">
                      Overtime Hours This Week
                    </th>
                  </tr>
                  <tr className="bg-[#18648e] text-white font-bold divide-x divide-[#125073] text-[11px]">
                    {/* Normal Hours Columns */}
                    <th className="py-1 text-center w-[4.5%]">Mon</th>
                    <th className="py-1 text-center w-[4.5%]">Tue</th>
                    <th className="py-1 text-center w-[4.5%]">Wed</th>
                    <th className="py-1 text-center w-[4.5%]">Thu</th>
                    <th className="py-1 text-center w-[4.5%]">Fri</th>

                    {/* Overtime Hours Columns */}
                    <th className="py-1 text-center w-[4%]">Sun</th>
                    <th className="py-1 text-center w-[4%]">Mon</th>
                    <th className="py-1 text-center w-[4%]">Tue</th>
                    <th className="py-1 text-center w-[4%]">Wed</th>
                    <th className="py-1 text-center w-[4%]">Thu</th>
                    <th className="py-1 text-center w-[4%]">Fri</th>
                    <th className="py-1 text-center w-[4%]">Sat</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="bg-white divide-y divide-slate-200">
                  {rows.map((row) => {
                    const normalTotal = calculateNormalTotal(row.normal);
                    const overtimeTotal = calculateOvertimeTotal(row.overtime);

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Project Dropdown */}
                        <td className="p-1.5 border-r border-slate-200">
                          <div className="relative">
                            <select
                              value={row.project}
                              onChange={(e) => updateRowField(row.id, 'project', e.target.value)}
                              className="w-full appearance-none px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 pr-6 focus:outline-none focus:border-[#1a6894]"
                            >
                              {availableProjects.map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
                          </div>
                        </td>

                        {/* Job ID */}
                        <td className="p-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.job_id}
                            onChange={(e) => updateRowField(row.id, 'job_id', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-center focus:outline-none focus:border-[#1a6894]"
                          />
                        </td>

                        {/* Total Normal Hours */}
                        <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-900 text-xs">
                          {normalTotal.toFixed(2)}
                        </td>

                        {/* Total Overtime Hours */}
                        <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-900 text-xs">
                          {overtimeTotal.toFixed(2)}
                        </td>

                        {/* Normal Days (Mon - Fri) */}
                        {(['mon', 'tue', 'wed', 'thu', 'fri'] as const).map((day) => (
                          <td key={day} className="p-1 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={row.normal[day] === 0 ? '0' : row.normal[day]}
                              onChange={(e) => updateNormalHours(row.id, day, e.target.value)}
                              className="w-full px-1 py-1.5 border border-slate-300 rounded text-xs text-center focus:outline-none focus:border-[#1a6894]"
                            />
                          </td>
                        ))}

                        {/* Overtime Days (Sun - Sat) */}
                        {(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const).map((day) => (
                          <td key={day} className="p-1 border-r border-slate-200 text-center">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={row.overtime[day] === 0 ? '0' : row.overtime[day]}
                              onChange={(e) => updateOvertimeHours(row.id, day, e.target.value)}
                              className="w-full px-1 py-1.5 border border-slate-300 rounded text-xs text-center focus:outline-none focus:border-[#1a6894]"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Optional multi-row adder for power users */}
            <div className="flex items-center justify-between pt-1.5 text-[11px] text-slate-500">
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 text-[#1a6894] hover:text-[#125073] font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project Row</span>
              </button>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveRow(rows[rows.length - 1].id)}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Last Row</span>
                </button>
              )}
            </div>
          </div>

          {/* Description textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#1a6894] shadow-2xs"
            />
          </div>

          {/* Footer Action Buttons matching exact colors and labels in screenshot */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="px-5 py-2 bg-[#e5a93c] hover:bg-[#d99b2e] active:scale-[0.98] text-slate-900 font-semibold rounded text-xs shadow-xs transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Report Timesheet</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAndAddAnother}
              className="px-5 py-2 bg-[#7fc2eb] hover:bg-[#6cb6e4] active:scale-[0.98] text-slate-900 font-semibold rounded text-xs shadow-xs transition-all"
            >
              Save And Add Another
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-8 py-2 bg-[#18648e] hover:bg-[#145377] active:scale-[0.98] text-white font-bold rounded text-xs shadow-xs transition-all"
            >
              Save
            </button>
          </div>
        </div>

      </div>

      {/* REPORT TIMESHEET SUMMARY / PDF PREVIEW MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-[#18648e] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold">Weekly Timesheet Report Preview</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800 font-sans">
              <div className="flex justify-between border-b pb-3">
                <div>
                  <h4 className="font-bold text-sm text-[#18648e]">AETHER ENTERPRISE SYSTEMS</h4>
                  <p className="text-[11px] text-slate-500">Official Labor & Time Accounting Voucher</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[10px]">
                    STATUS: {status.toUpperCase()}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">Week Ending: {weekEnding}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Employee</span>
                  <span className="font-bold text-slate-800">{employee}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Position / Job</span>
                  <span className="font-semibold text-slate-800">
                    {position || 'Specialist'} {job ? `(${job})` : ''}
                  </span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2 text-left">Project</th>
                      <th className="p-2 text-center">Job ID</th>
                      <th className="p-2 text-right">Normal Hours</th>
                      <th className="p-2 text-right">Overtime Hours</th>
                      <th className="p-2 text-right">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => {
                      const n = calculateNormalTotal(r.normal);
                      const o = calculateOvertimeTotal(r.overtime);
                      return (
                        <tr key={r.id}>
                          <td className="p-2 font-medium">{r.project}</td>
                          <td className="p-2 text-center text-slate-500">{r.job_id || '-'}</td>
                          <td className="p-2 text-right font-mono">{n.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono">{o.toFixed(2)}</td>
                          <td className="p-2 text-right font-mono font-bold">{(n + o).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={2} className="p-2 text-right text-slate-700">WEEKLY TOTAL:</td>
                      <td className="p-2 text-right font-mono text-[#18648e]">{grandTotalNormal.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono text-[#18648e]">{grandTotalOvertime.toFixed(2)}</td>
                      <td className="p-2 text-right font-mono text-[#18648e] text-sm">
                        {(grandTotalNormal + grandTotalOvertime).toFixed(2)} hrs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Description */}
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Work Log Summary</span>
                <p className="text-slate-700 italic">{description || 'No description provided'}</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-300"></div>
                  <span className="mt-1 block font-semibold text-slate-700">Employee Signature</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-300"></div>
                  <span className="mt-1 block font-semibold text-slate-700">Project Manager</span>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-300"></div>
                  <span className="mt-1 block font-semibold text-slate-700">HR / Finance Approval</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-1.5 border border-slate-200 rounded text-slate-700 hover:bg-slate-50 font-semibold text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-1.5 bg-[#18648e] hover:bg-[#145377] text-white font-bold rounded text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
