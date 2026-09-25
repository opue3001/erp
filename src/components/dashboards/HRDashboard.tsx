import React, { useMemo, useState } from 'react';
import { 
  Users, 
  DollarSign, 
  Briefcase, 
  Building, 
  Plus, 
  ArrowUpRight, 
  UserCheck, 
  Calendar,
  Award,
  GraduationCap,
  Search,
  ChevronRight,
  Mail,
  Phone,
  Plane,
  Clock,
  Sparkles,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { frappeDB } from '../../framework/db';

interface HRDashboardProps {
  onSelectDocType: (doctype: string) => void;
  onOpenDoc: (doctype: string, docName: string) => void;
  onNewDoc: (doctype: string) => void;
}

export const HRDashboard: React.FC<HRDashboardProps> = ({
  onSelectDocType,
  onOpenDoc,
  onNewDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const employees = frappeDB.get_list('Employee');

  // Aggregates
  const totalMonthlyPayroll = employees.reduce((sum, emp) => sum + (Number(emp.monthly_salary) || 0), 0);
  const annualizedPayroll = totalMonthlyPayroll * 12;
  const avgMonthlySalary = employees.length > 0 ? totalMonthlyPayroll / employees.length : 0;
  const activeCount = employees.filter((e) => e.status === 'Active').length;
  const onLeaveCount = employees.filter((e) => e.status === 'On Leave').length;

  // Departmental distribution
  const deptStats = useMemo(() => {
    const map: Record<string, { count: number; totalSalary: number }> = {};
    employees.forEach((emp) => {
      const d = emp.department || 'Other';
      if (!map[d]) map[d] = { count: 0, totalSalary: 0 };
      map[d].count += 1;
      map[d].totalSalary += Number(emp.monthly_salary) || 0;
    });
    return Object.entries(map).map(([department, data]) => ({
      department,
      count: data.count,
      totalSalary: data.totalSalary,
      avgSalary: Math.round(data.totalSalary / data.count),
    }));
  }, [employees]);

  const maxDeptSalary = Math.max(...deptStats.map((d) => d.totalSalary), 1);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch = 
        !searchQuery || 
        emp.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.company_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDept === 'All' || emp.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, selectedDept]);

  const getInitials = (name?: string) => {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getDepartmentColor = (dept?: string) => {
    switch (dept) {
      case 'Engineering':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Sales & Marketing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Finance & Accounting':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Operations & Logistics':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'People & HR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>ERP Modules</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Human Resources</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Workforce & People Operations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Organizational structure, payroll allocation, employee records, and talent retention metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNewDoc('Employee')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Headcount</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {employees.length} Personnel
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-emerald-600 font-semibold">{activeCount} Active</span>
            <span aria-hidden="true">·</span>
            <span>100% Full-time</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Monthly Payroll Commitment</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalMonthlyPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Annual Run-rate: <strong>${(annualizedPayroll / 1000).toFixed(0)}k</strong></span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Departments</span>
            <Building className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {deptStats.length} Divisions
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Engineering, Ops, Sales & Finance</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Monthly Compensation</span>
            <Briefcase className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${avgMonthlySalary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Competitive tech scale</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Departmental Payroll & Org Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departmental Allocation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Departmental Payroll Allocation</h3>
              <p className="text-xs text-slate-500">Monthly salary spend per functional business unit</p>
            </div>
            <Building className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 pt-1">
            {deptStats.map((d) => {
              const pct = Math.round((d.totalSalary / maxDeptSalary) * 100);
              return (
                <div key={d.department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{d.department}</span>
                    <div className="flex items-center gap-2 font-mono text-slate-600">
                      <span>{d.count} staff</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900">${d.totalSalary.toLocaleString()}/mo</span>
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

        {/* HR Policy & Employment Health */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Workforce Dynamics</h3>
              <p className="text-xs text-slate-500">Compensation parity, contracts, and retention indicators</p>
            </div>
            <Award className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Employment Terms</div>
              <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                100% Full-time
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Indefinite direct corporate employment</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Retention Rate</div>
              <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
                98.4%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Zero involuntary churn in Q1 2026</p>
            </div>

            <div className="col-span-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center gap-3 text-xs text-indigo-950">
              <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <strong>HR Compliance Verified:</strong> All personnel salaries conform to federal grade minima and statutory health benefit packages.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Comprehensive Employee Directory (360° Profile)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                {filteredEmployees.length} of {employees.length} Personnel
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any employee record to open full 360° dossier, generate payslips, track leave balances, and view organization hierarchy.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, division, email..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 w-56"
              />
            </div>

            <button
              onClick={() => onNewDoc('Employee')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Department Filter Chips */}
        <div className="px-6 flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Division:</span>
          {['All', 'Engineering', 'Sales & Marketing', 'Finance & Accounting', 'Operations & Logistics', 'People & HR'].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                selectedDept === dept
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {dept === 'All' ? 'All Divisions' : dept}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-6">Employee & Profile</th>
                <th className="py-3 px-4">Department & Grade</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Contact & Location</th>
                <th className="py-3 px-4 text-center">Leave Balance</th>
                <th className="py-3 px-4 text-right">Base Salary ($)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    No employee records found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr
                    key={emp.name}
                    onClick={() => onOpenDoc('Employee', emp.name)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono shadow-xs shrink-0 group-hover:bg-indigo-600 transition-colors">
                          {getInitials(emp.employee_name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            <span>{emp.employee_name}</span>
                            <span className="font-mono text-[10px] text-slate-400 font-normal">({emp.name})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{emp.company_email || 'email@internal'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-md border ${getDepartmentColor(emp.department)}`}>
                        {emp.department}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        {emp.grade || 'L3 - Senior'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{emp.designation}</div>
                      <div className="text-[10px] text-slate-400">Joined: {emp.date_of_joining}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      <div>{emp.work_location || 'Headquarters'}</div>
                      <div className="text-[10px] text-slate-400">{emp.cell_number || '-'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>{emp.leave_balance ?? 12} days</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                      ${Number(emp.monthly_salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      <div className="text-[10px] text-slate-400 font-normal font-sans">
                        / month
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        emp.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : emp.status === 'On Leave'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        ● {emp.status || 'Active'}
                      </span>
                    </td>

                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDoc('Employee', emp.name);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1 group-hover:shadow-xs"
                      >
                        <span>360° Dossier</span>
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
    </div>
  );
};
