import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  User, 
  FolderKanban, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Save, 
  Briefcase, 
  FileText,
  Building,
  Check,
  Percent
} from 'lucide-react';
import { frappeDB } from '../../framework/db';
import { TimesheetDoc, ProjectDoc, EmployeeDoc, TaskDoc } from '../../types/erp';
import { CreateTimesheetModal } from '../desk/CreateTimesheetModal';

interface TimesheetViewProps {
  initialProjectId?: string;
  onOpenDoc: (doctype: string, docName: string) => void;
  onNewDoc: (doctype: string) => void;
}

const ACTIVITY_TYPES = [
  'Software Development',
  'Architecture Design',
  'Quality Assurance',
  'Project Management',
  'Client Consultation',
  'Code Review',
  'DevOps & Infrastructure'
];

export const TimesheetView: React.FC<TimesheetViewProps> = ({
  initialProjectId,
  onOpenDoc,
  onNewDoc,
}) => {
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || 'All');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogTimeModal, setShowLogTimeModal] = useState(false);

  // New Timesheet Form state
  const [newTsData, setNewTsData] = useState<Partial<TimesheetDoc>>({
    employee: 'Dr. Marcus Sterling',
    project: initialProjectId || 'PROJ-2026-001',
    task: '',
    start_date: new Date().toISOString().substring(0, 10),
    hours: 7.5,
    is_billable: true,
    billing_rate: 120,
    activity_type: 'Software Development',
    notes: '',
  });

  const timesheets = (frappeDB.get_list('Timesheet') || []) as TimesheetDoc[];
  const projects = (frappeDB.get_list('Project') || []) as ProjectDoc[];
  const employees = (frappeDB.get_list('Employee') || []) as EmployeeDoc[];
  const tasks = (frappeDB.get_list('Task') || []) as TaskDoc[];

  // Aggregates
  const totalHours = timesheets.reduce((sum, ts) => sum + (Number(ts.hours) || 0), 0);
  const billableTimesheets = timesheets.filter((ts) => ts.is_billable);
  const billableHours = billableTimesheets.reduce((sum, ts) => sum + (Number(ts.hours) || 0), 0);
  const totalBilledRevenue = timesheets.reduce((sum, ts) => sum + (Number(ts.total_billed_amount) || 0), 0);
  const billableRatio = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;
  const activeContributors = new Set(timesheets.map((ts) => ts.employee)).size;

  // Filtered
  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((ts) => {
      const matchProject = selectedProject === 'All' || ts.project === selectedProject;
      const matchEmp = selectedEmployee === 'All' || ts.employee === selectedEmployee;
      const matchSearch =
        !searchQuery ||
        ts.employee?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ts.project?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ts.task?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ts.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ts.activity_type?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchProject && matchEmp && matchSearch;
    });
  }, [timesheets, selectedProject, selectedEmployee, searchQuery]);

  const handleLogTime = () => {
    const hours = Number(newTsData.hours) || 0;
    if (hours <= 0) {
      alert('Please enter a valid number of hours');
      return;
    }
    const rate = Number(newTsData.billing_rate) || 0;
    const isBillable = newTsData.is_billable ?? true;
    const totalAmount = isBillable ? Math.round(hours * rate * 100) / 100 : 0;

    const created = frappeDB.insert({
      doctype: 'Timesheet',
      ...newTsData,
      hours,
      billing_rate: rate,
      total_billed_amount: totalAmount,
    } as any);

    // Also update project billed hours if linked
    if (newTsData.project) {
      const proj = frappeDB.get_doc('Project', newTsData.project);
      if (proj) {
        const curHours = Number(proj.total_billed_hours) || 0;
        const curCost = Number(proj.actual_cost) || 0;
        frappeDB.set_value('Project', proj.name, 'total_billed_hours', curHours + hours);
        frappeDB.set_value('Project', proj.name, 'actual_cost', curCost + totalAmount);
      }
    }

    setShowLogTimeModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>ERP Modules</span>
            <span aria-hidden="true">/</span>
            <span>Projects</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Labor & Billing</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-emerald-600" />
            <span>Timesheet & Labor Tracking</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Capture direct billable engineering hours, hourly rates, project allocations, and labor cost reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLogTimeModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#18648e] hover:bg-[#145377] rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Timesheet</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Logged Hours</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalHours.toFixed(1)} Hours
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-emerald-600 font-semibold">{billableHours.toFixed(1)} Billable</span>
            <span aria-hidden="true">·</span>
            <span>{(totalHours - billableHours).toFixed(1)} Internal</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Billable Ratio</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {billableRatio}%
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${billableRatio}%` }}
            />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Labor Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalBilledRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span>Dispatched to general ledger</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Contributors</span>
            <User className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {activeContributors} Engineers
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Across {projects.length} portfolios</span>
          </div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none"
            >
              <option value="All">All Projects</option>
              {projects.map((p) => (
                <option key={p.name} value={p.name}>{p.name} - {p.project_name}</option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Employee:</span>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none"
            >
              <option value="All">All Personnel</option>
              {employees.map((emp) => (
                <option key={emp.name} value={emp.employee_name}>{emp.employee_name}</option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {filteredTimesheets.length} Logs Found
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, activity, notes..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 w-64"
          />
        </div>
      </div>

      {/* Timesheets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-6">Employee & Profile</th>
                <th className="py-3 px-4">Project & Task</th>
                <th className="py-3 px-4">Activity Category</th>
                <th className="py-3 px-4">Log Date</th>
                <th className="py-3 px-4 text-center">Hours</th>
                <th className="py-3 px-4 text-center">Billable</th>
                <th className="py-3 px-4 text-right">Rate / Total</th>
                <th className="py-3 px-4">Notes & Remarks</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                    No timesheet logs matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredTimesheets.map((ts) => (
                  <tr
                    key={ts.name}
                    onClick={() => onOpenDoc('Timesheet', ts.name)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center font-mono shrink-0">
                          {ts.employee?.substring(0, 2).toUpperCase() || 'EM'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{ts.employee}</div>
                          <div className="text-[10px] font-mono text-slate-400">{ts.name}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{ts.project}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{ts.task || 'General Sprint Execution'}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {ts.activity_type || 'Software Development'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                      {ts.start_date}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono font-bold text-slate-900 text-sm">
                      {ts.hours} hrs
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {ts.is_billable ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          <span>Billable</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Internal</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                      <div className="font-bold text-slate-900">
                        ${Number(ts.total_billed_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ${ts.billing_rate}/hr
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 truncate max-w-[200px]">
                      {ts.notes || '-'}
                    </td>

                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDoc('Timesheet', ts.name);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TIMESHEET MODAL */}
      <CreateTimesheetModal
        isOpen={showLogTimeModal}
        onClose={() => setShowLogTimeModal(false)}
        onSaved={() => {
          // subscription refreshes data
        }}
      />

    </div>
  );
};
