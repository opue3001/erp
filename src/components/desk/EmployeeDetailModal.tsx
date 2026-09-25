import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Printer, 
  Trash2, 
  AlertCircle,
  FileCheck,
  Building,
  Briefcase,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  Award,
  GraduationCap,
  Sparkles,
  ChevronRight,
  Shield,
  Plane,
  Heart,
  PhoneCall,
  Mail,
  Home,
  UserCheck,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { BaseDoc, User, EmployeeDoc } from '../../types/erp';
import { frappeDB } from '../../framework/db';
import { frappeAuth } from '../../framework/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EmployeeDetailModalProps {
  docName: string | null; // null means creating new
  currentUser: User;
  onClose: () => void;
  onSaved: (doc: BaseDoc) => void;
}

type TabType = 'personal' | 'employment' | 'payroll' | 'leaves' | 'skills';

const DEPARTMENTS = [
  'Engineering',
  'Sales & Marketing',
  'Finance & Accounting',
  'Operations & Logistics',
  'People & HR',
  'Product & Design',
  'Legal & Compliance'
];

const GRADES = [
  'L1 - Associate',
  'L2 - Specialist',
  'L3 - Senior Engineer / Lead',
  'L4 - Manager / Staff',
  'L5 - Director / Executive'
];

const WORK_LOCATIONS = [
  'Headquarters',
  'Tech Hub Silicon Valley',
  'London Regional Office',
  'Singapore Logistics Hub',
  'Remote / WFH'
];

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Contract',
  'Part-time',
  'Internship',
  'Probation'
];

const STATUSES = [
  'Active',
  'On Leave',
  'Probation',
  'Terminated',
  'Resigned'
];

const BANKS = [
  'Bank Central Asia',
  'Bank Mandiri',
  'JPMorgan Chase',
  'Citibank',
  'HSBC',
  'Barclays'
];

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  docName,
  currentUser,
  onClose,
  onSaved,
}) => {
  const isNew = !docName;
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Leave application state
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [leaveReason, setLeaveReason] = useState('');

  // Form State
  const [formData, setFormData] = useState<Partial<EmployeeDoc>>(() => {
    if (!isNew && docName) {
      const existing = frappeDB.get_doc('Employee', docName);
      if (existing) return { ...existing };
    }

    return {
      doctype: 'Employee',
      docstatus: 0,
      employee_name: '',
      first_name: '',
      last_name: '',
      gender: 'Female',
      date_of_birth: '1995-01-01',
      marital_status: 'Single',
      blood_group: 'O+',
      identification_id: 'ID-2026-0001',
      department: 'Engineering',
      designation: 'Software Engineer',
      grade: 'L3 - Senior Engineer / Lead',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: new Date().toISOString().substring(0, 10),
      confirmation_date: new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10),
      reports_to: 'Dr. Marcus Sterling',
      work_location: 'Headquarters',
      company_email: '',
      personal_email: '',
      cell_number: '+1 (555) 010-2020',
      emergency_contact_name: '',
      emergency_contact_phone: '+1 (555) 010-9999',
      current_address: '',
      monthly_salary: 8500,
      allowance_housing: 1400,
      allowance_transport_meal: 600,
      deduction_tax_health: 1250,
      bank_name: 'JPMorgan Chase',
      bank_account_no: '8841-9920-1102',
      bank_account_name: '',
      leave_balance: 12,
      leaves_taken: 0,
      attendance_rate: 100,
      skills: 'TypeScript, React, Python, Problem Solving',
      education: 'Bachelor of Science in Computer Science',
      performance_rating: 4.8,
      bio_notes: 'Newly onboarded team member with strong technical acumen.',
    };
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canWrite = frappeAuth.hasPermission('Employee', 'write', currentUser);
  const canDelete = frappeAuth.hasPermission('Employee', 'delete', currentUser);

  const handleFieldChange = (fieldname: keyof EmployeeDoc, val: any) => {
    setFormData((prev) => {
      const next = { ...prev, [fieldname]: val };
      if (fieldname === 'first_name' || fieldname === 'last_name') {
        const full = `${next.first_name || ''} ${next.last_name || ''}`.trim();
        if (full) next.employee_name = full;
      }
      return next;
    });
  };

  const handleSave = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.employee_name?.trim()) {
      setErrorMessage('Full Name is required.');
      return;
    }

    try {
      if (isNew) {
        const created = frappeDB.insert(formData as any, currentUser.full_name);
        setFormData(created);
        setSuccessMessage(`Employee record ${created.name} registered successfully.`);
        onSaved(created);
      } else {
        const saved = frappeDB.save(formData as any, currentUser.full_name);
        setFormData(saved);
        setSuccessMessage(`Employee ${saved.name} updated successfully.`);
        onSaved(saved);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save employee profile.');
    }
  };

  const handleDelete = () => {
    if (!formData.name) return;
    if (confirm(`Are you sure you want to permanently delete employee ${formData.employee_name} (${formData.name})?`)) {
      try {
        frappeDB.delete_doc('Employee', formData.name);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to delete employee.');
      }
    }
  };

  // Process Leave Request
  const handleApplyLeave = () => {
    const days = Number(leaveDays) || 1;
    const currentBalance = Number(formData.leave_balance) || 0;
    if (days > currentBalance) {
      alert(`Requested leave days (${days}) exceeds remaining leave balance (${currentBalance} days).`);
      return;
    }

    const updatedBalance = currentBalance - days;
    const updatedTaken = (Number(formData.leaves_taken) || 0) + days;
    
    setFormData((prev) => ({
      ...prev,
      leave_balance: updatedBalance,
      leaves_taken: updatedTaken,
      status: 'On Leave'
    }));

    if (formData.name) {
      frappeDB.set_value('Employee', formData.name, 'leave_balance', updatedBalance);
      frappeDB.set_value('Employee', formData.name, 'leaves_taken', updatedTaken);
      frappeDB.set_value('Employee', formData.name, 'status', 'On Leave');
    }

    setShowLeaveModal(false);
    setSuccessMessage(`Leave request of ${days} day(s) approved. New balance: ${updatedBalance} days.`);
  };

  // Calculated totals
  const monthlySalary = Number(formData.monthly_salary) || 0;
  const housing = Number(formData.allowance_housing) || 0;
  const transport = Number(formData.allowance_transport_meal) || 0;
  const deductions = Number(formData.deduction_tax_health) || 0;
  const grossPay = monthlySalary + housing + transport;
  const netPay = Math.max(0, grossPay - deductions);

  // Generate Payslip PDF using jsPDF
  const handleDownloadPayslipPDF = () => {
    const doc = new jsPDF();
    const period = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Header Letterhead
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('AETHER DYNAMICS CORPORATION', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Global Enterprise Resource Planning · Confidential Salary Slip', 14, 25);

    // Period pill
    doc.setFont('helvetica', 'bold');
    doc.text(`PAYROLL PERIOD: ${period.toUpperCase()}`, 135, 20);

    // Employee Meta Box
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('EMPLOYEE DOSSIER', 14, 42);

    autoTable(doc, {
      startY: 46,
      head: [['Employee ID', 'Full Name', 'Department', 'Designation', 'Tax/SSN ID']],
      body: [
        [
          formData.name || 'EMP-TEMP',
          formData.employee_name || 'N/A',
          formData.department || 'N/A',
          formData.designation || 'N/A',
          formData.identification_id || 'ID-REG-2026'
        ]
      ],
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 9, textColor: [15, 23, 42] },
      styles: { cellPadding: 3 }
    });

    // Compensation & Allowances Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [['Earnings Category', 'Amount ($)', 'Deductions & Statutory', 'Amount ($)']],
      body: [
        ['Monthly Base Salary', `$ ${monthlySalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Federal / Income Tax (WHT)', `$ ${(deductions * 0.65).toFixed(2)}`],
        ['Housing Allowance', `$ ${housing.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Statutory Healthcare & Insurance', `$ ${(deductions * 0.20).toFixed(2)}`],
        ['Transport & Meal Allowance', `$ ${transport.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Pension & Retirement Fund', `$ ${(deductions * 0.15).toFixed(2)}`],
        ['Gross Earnings Total', `$ ${grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Total Deductions', `$ ${deductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      styles: { cellPadding: 3.5 }
    });

    // Net Take Home Pay banner
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(34, 197, 94); // emerald-500
    doc.rect(14, finalY, 182, 24, 'FD');

    doc.setTextColor(22, 101, 52); // emerald-800
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('NET SALARY PAYABLE (TAKE HOME PAY)', 20, finalY + 10);

    doc.setFontSize(16);
    doc.text(`$ ${netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`, 20, finalY + 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Disbursed to: ${formData.bank_name || 'Corporate Bank'} · A/C: ${formData.bank_account_no || 'Pending'} (${formData.bank_account_name || formData.employee_name})`, 20, finalY + 22);

    // Signatures
    const sigY = finalY + 45;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Prepared by Finance Controller', 14, sigY);
    doc.line(14, sigY + 15, 75, sigY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text('Claire Dupont (CPA)', 14, sigY + 20);

    doc.setFont('helvetica', 'bold');
    doc.text('Approved by HR & People Ops', 130, sigY);
    doc.line(130, sigY + 15, 190, sigY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text('Priya Patel (Head of People)', 130, sigY + 20);

    doc.save(`Payslip_${formData.name || 'EMP'}_${period.replace(/\s+/g, '_')}.pdf`);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header & Identity Card */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white p-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left: Avatar & Key Badges */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0 font-mono">
                {getInitials(formData.employee_name)}
              </div>
              
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {formData.name || 'NEW EMP'}
                  </span>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    formData.status === 'Active' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : formData.status === 'On Leave'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    ● {formData.status || 'Active'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {formData.employment_type || 'Full-time'}
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {formData.employee_name || 'New Employee Profile'}
                </h1>
                
                <div className="flex items-center gap-4 text-xs text-slate-300 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    {formData.department || 'Engineering'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {formData.designation || 'Specialist'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {formData.work_location || 'Headquarters'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              {!isNew && (
                <>
                  <button
                    onClick={() => setShowPayslipModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 shadow-xs"
                    title="Generate Confidential Payslip"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Payslip</span>
                  </button>

                  <button
                    onClick={() => setShowBadgeModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 shadow-xs"
                    title="Print Employee ID Badge"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-400" />
                    <span>ID Badge</span>
                  </button>

                  <button
                    onClick={() => setShowLeaveModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 shadow-xs"
                    title="Submit Leave Request"
                  >
                    <Plane className="w-3.5 h-3.5 text-amber-400" />
                    <span>Request Leave</span>
                  </button>
                </>
              )}

              {canWrite && (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-md ml-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </button>
              )}

              {!isNew && canDelete && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Delete Employee"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-6 border-t border-white/10 pt-3 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab('personal')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'personal'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Personal Info & Contact</span>
            </button>

            <button
              onClick={() => setActiveTab('employment')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'employment'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Employment & Organization</span>
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'payroll'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Payroll & Compensation</span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'leaves'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Leaves & Attendance</span>
            </button>

            <button
              onClick={() => setActiveTab('skills')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'skills'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Skills & Performance</span>
            </button>
          </div>
        </div>

        {/* Notifications / Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <FileCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          
          {/* TAB 1: PERSONAL & CONTACT */}
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Personal Identity & Demographics</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      value={formData.employee_name || ''}
                      onChange={(e) => handleFieldChange('employee_name', e.target.value)}
                      placeholder="e.g. Dr. Marcus Sterling"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">First Name</label>
                    <input
                      type="text"
                      value={formData.first_name || ''}
                      onChange={(e) => handleFieldChange('first_name', e.target.value)}
                      placeholder="Marcus"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Last Name</label>
                    <input
                      type="text"
                      value={formData.last_name || ''}
                      onChange={(e) => handleFieldChange('last_name', e.target.value)}
                      placeholder="Sterling"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">National ID / SSN / Tax ID</label>
                    <input
                      type="text"
                      value={formData.identification_id || ''}
                      onChange={(e) => handleFieldChange('identification_id', e.target.value)}
                      placeholder="e.g. ID-US-9830211"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Gender</label>
                    <select
                      value={formData.gender || 'Female'}
                      onChange={(e) => handleFieldChange('gender', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Marital Status</label>
                    <select
                      value={formData.marital_status || 'Single'}
                      onChange={(e) => handleFieldChange('marital_status', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Blood Group</label>
                    <select
                      value={formData.blood_group || 'O+'}
                      onChange={(e) => handleFieldChange('blood_group', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Information & Emergency Contacts */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Official & Emergency Contacts</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Company Email</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        value={formData.company_email || ''}
                        onChange={(e) => handleFieldChange('company_email', e.target.value)}
                        placeholder="marcus.sterling@aether-erp.internal"
                        className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Personal Email</label>
                    <input
                      type="email"
                      value={formData.personal_email || ''}
                      onChange={(e) => handleFieldChange('personal_email', e.target.value)}
                      placeholder="m.sterling@gmail.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Cell / Phone Number</label>
                    <input
                      type="text"
                      value={formData.cell_number || ''}
                      onChange={(e) => handleFieldChange('cell_number', e.target.value)}
                      placeholder="+1 (415) 555-0182"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Emergency Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name || ''}
                      onChange={(e) => handleFieldChange('emergency_contact_name', e.target.value)}
                      placeholder="e.g. Eleanor Sterling (Spouse)"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Emergency Contact Phone</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_phone || ''}
                      onChange={(e) => handleFieldChange('emergency_contact_phone', e.target.value)}
                      placeholder="+1 (415) 555-0199"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Residential Address</label>
                    <div className="relative">
                      <Home className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.current_address || ''}
                        onChange={(e) => handleFieldChange('current_address', e.target.value)}
                        placeholder="450 Mission St, Apt 28B, San Francisco, CA 94105"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EMPLOYMENT & ORGANIZATION */}
          {activeTab === 'employment' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Employment Structure & Role</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Department / Division *</label>
                    <select
                      value={formData.department || 'Engineering'}
                      onChange={(e) => handleFieldChange('department', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Designation / Job Title *</label>
                    <input
                      type="text"
                      value={formData.designation || ''}
                      onChange={(e) => handleFieldChange('designation', e.target.value)}
                      placeholder="e.g. Principal Systems Architect"
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Employment Grade / Level</label>
                    <select
                      value={formData.grade || 'L3 - Senior Engineer / Lead'}
                      onChange={(e) => handleFieldChange('grade', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Employment Status</label>
                    <select
                      value={formData.status || 'Active'}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold text-slate-900"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Employment Agreement Type</label>
                    <select
                      value={formData.employment_type || 'Full-time'}
                      onChange={(e) => handleFieldChange('employment_type', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      {EMPLOYMENT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Work Location / Branch</label>
                    <select
                      value={formData.work_location || 'Headquarters'}
                      onChange={(e) => handleFieldChange('work_location', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      {WORK_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Date of Joining *</label>
                    <input
                      type="date"
                      value={formData.date_of_joining || ''}
                      onChange={(e) => handleFieldChange('date_of_joining', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Confirmation Date</label>
                    <input
                      type="date"
                      value={formData.confirmation_date || ''}
                      onChange={(e) => handleFieldChange('confirmation_date', e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Direct Supervisor (Reports To)</label>
                    <input
                      type="text"
                      value={formData.reports_to || ''}
                      onChange={(e) => handleFieldChange('reports_to', e.target.value)}
                      placeholder="e.g. Dr. Marcus Sterling"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Organizational Hierarchy Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Direct Reporting Hierarchy
                </h4>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center font-mono">
                    {getInitials(formData.reports_to)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{formData.reports_to || 'Board of Directors'}</div>
                    <div className="text-[11px] text-slate-500">Direct Reporting Manager & Performance Evaluator</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMPENSATION & PAYROLL */}
          {activeTab === 'payroll' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase">Monthly Base Salary</div>
                  <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                    ${monthlySalary.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Contractual monthly base</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs font-medium text-slate-500 uppercase">Gross Monthly Earnings</div>
                  <div className="text-2xl font-bold font-mono text-indigo-600 mt-1">
                    ${grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Including standard allowances</div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
                  <div className="text-xs font-medium text-emerald-800 uppercase font-semibold">Net Take-Home Pay</div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                    ${netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1">After statutory taxes & healthcare</div>
                </div>
              </div>

              {/* Compensation Breakdown Form */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Compensation & Allowances Breakdown</h3>
                  </div>
                  <button
                    onClick={() => setShowPayslipModal(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Official Payslip Preview</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Monthly Base Salary ($) *</label>
                    <input
                      type="number"
                      value={formData.monthly_salary ?? 0}
                      onChange={(e) => handleFieldChange('monthly_salary', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Housing Allowance ($)</label>
                    <input
                      type="number"
                      value={formData.allowance_housing ?? 0}
                      onChange={(e) => handleFieldChange('allowance_housing', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Transport & Meal Allowance ($)</label>
                    <input
                      type="number"
                      value={formData.allowance_transport_meal ?? 0}
                      onChange={(e) => handleFieldChange('allowance_transport_meal', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Tax & Health Deductions ($)</label>
                    <input
                      type="number"
                      value={formData.deduction_tax_health ?? 0}
                      onChange={(e) => handleFieldChange('deduction_tax_health', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono text-rose-600 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Account Disbursement Details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-slate-900">Disbursement Bank Account</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Banking Institution</label>
                    <select
                      value={formData.bank_name || 'JPMorgan Chase'}
                      onChange={(e) => handleFieldChange('bank_name', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      {BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Bank Account Number</label>
                    <input
                      type="text"
                      value={formData.bank_account_no || ''}
                      onChange={(e) => handleFieldChange('bank_account_no', e.target.value)}
                      placeholder="e.g. 8820-4911-3021"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Beneficiary Account Holder</label>
                    <input
                      type="text"
                      value={formData.bank_account_name || formData.employee_name || ''}
                      onChange={(e) => handleFieldChange('bank_account_name', e.target.value)}
                      placeholder="As registered in banking records"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LEAVES & ATTENDANCE */}
          {activeTab === 'leaves' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              
              {/* Leave Balances Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Remaining Leave Balance</div>
                  <div className="text-3xl font-bold font-mono text-indigo-600 mt-1">
                    {formData.leave_balance ?? 12} Days
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Current annual entitlement</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Leaves Taken to Date</div>
                  <div className="text-3xl font-bold font-mono text-slate-700 mt-1">
                    {formData.leaves_taken ?? 0} Days
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Approved by HR</div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Attendance Rate</div>
                  <div className="text-3xl font-bold font-mono text-emerald-600 mt-1">
                    {formData.attendance_rate ?? 98.5}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Excellent attendance record</div>
                </div>
              </div>

              {/* Interactive Quick Leave Application */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Employee Leave Application (Instant Booking)</h3>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Auto-Deducts Balance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Leave Category</label>
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Sick Leave">Paid Medical / Sick Leave</option>
                      <option value="Special Family Care">Compassionate & Family Care</option>
                      <option value="Unpaid Leave">Unpaid Leave</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Commencement Date</label>
                    <input
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      max={formData.leave_balance || 12}
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Reason for Leave / Justification Notes</label>
                    <input
                      type="text"
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="e.g. Annual vacation or family emergency"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={handleApplyLeave}
                      className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Deduct Balance</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SKILLS, EDUCATION & PERFORMANCE */}
          {activeTab === 'skills' && (
            <div className="space-y-6 animate-in fade-in duration-100">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Education & Core Competencies</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Highest Educational Degree</label>
                    <input
                      type="text"
                      value={formData.education || ''}
                      onChange={(e) => handleFieldChange('education', e.target.value)}
                      placeholder="e.g. M.Sc. in Computer Systems, Stanford University (2012)"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Core Skills & Competencies (Comma-separated)</label>
                    <textarea
                      rows={2}
                      value={formData.skills || ''}
                      onChange={(e) => handleFieldChange('skills', e.target.value)}
                      placeholder="React, TypeScript, ERP Architecture, High Concurrency, PostgreSQL"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Render Visual Skill Badges */}
                  {formData.skills && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {formData.skills.split(',').map((skill, i) => (
                        <span key={i} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Review */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-slate-900">Performance Review & HR Assessment</h3>
                  </div>
                  <div className="flex items-center gap-1 font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                    <span>★</span>
                    <span>{formData.performance_rating || 4.8} / 5.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Performance Score (1.0 - 5.0)</label>
                    <input
                      type="number"
                      step="0.05"
                      min="1"
                      max="5"
                      value={formData.performance_rating ?? 4.8}
                      onChange={(e) => handleFieldChange('performance_rating', parseFloat(e.target.value) || 4.8)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-3 space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Managerial Assessment & Development Summary</label>
                    <textarea
                      rows={2}
                      value={formData.bio_notes || ''}
                      onChange={(e) => handleFieldChange('bio_notes', e.target.value)}
                      placeholder="Key strengths, leadership capabilities, milestones, and career trajectory..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Footer */}
          {!isNew && (
            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>DocType: <strong>Employee (HR Module)</strong></span>
                <span aria-hidden="true">·</span>
                <span>Managed by: <strong>{formData.owner || 'System'}</strong></span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums">
                <span>Created: {formData.creation || '2026-01-01'}</span>
                <span aria-hidden="true">·</span>
                <span>Modified: {formData.modified || 'Just now'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: PAYSLIP PREVIEW & PDF EXPORT */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Confidential Salary Slip (Earnings Statement)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPayslipPDF}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowPayslipModal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Payslip Document Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-50">
              <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-5">
                
                {/* Corporation Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-950 tracking-wider">AETHER DYNAMICS CORP</h2>
                    <p className="text-[11px] text-slate-500">Corporate Global Payroll & Financial Accounting</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                      PERIOD: {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">{formData.name}</div>
                  </div>
                </div>

                {/* Employee Meta Grid */}
                <div className="grid grid-cols-2 gap-2 text-slate-600 py-1">
                  <div>Employee Name: <strong className="text-slate-900">{formData.employee_name}</strong></div>
                  <div>Department: <strong className="text-slate-900">{formData.department}</strong></div>
                  <div>Designation: <strong className="text-slate-900">{formData.designation}</strong></div>
                  <div>Tax / SSN ID: <strong className="text-slate-900 font-mono">{formData.identification_id || 'ID-2026'}</strong></div>
                  <div>Employment Status: <strong className="text-slate-900">{formData.employment_type}</strong></div>
                  <div>Disbursing Bank: <strong className="text-slate-900">{formData.bank_name} ({formData.bank_account_no})</strong></div>
                </div>

                {/* Earnings vs Deductions Table */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                    <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
                      Earnings Breakdown
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Monthly Base Salary:</span>
                      <span className="font-mono text-slate-900">${monthlySalary.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Housing Allowance:</span>
                      <span className="font-mono text-slate-900">${housing.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Transport & Meal Allowance:</span>
                      <span className="font-mono text-slate-900">${transport.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-slate-900">
                      <span>Gross Earnings Total:</span>
                      <span className="font-mono">${grossPay.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                    <div className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-1">
                      Statutory Deductions
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Federal / Income Tax (WHT):</span>
                      <span className="font-mono text-rose-600">-${(deductions * 0.65).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Healthcare & Medical Insurance:</span>
                      <span className="font-mono text-rose-600">-${(deductions * 0.20).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Pension & Retirement Fund:</span>
                      <span className="font-mono text-rose-600">-${(deductions * 0.15).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-slate-900">
                      <span>Total Deductions:</span>
                      <span className="font-mono text-rose-600">-${deductions.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Pay Callout */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      TOTAL NET SALARY PAYABLE (TAKE HOME PAY)
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-700 mt-0.5">
                      ${netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    Status: <span className="text-emerald-700 font-bold">Disbursed / Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ID BADGE PREVIEW */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold">Employee Security Pass / ID Badge</span>
              <button onClick={() => setShowBadgeModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center space-y-4 bg-gradient-to-b from-slate-100 to-white">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600 text-white font-bold text-3xl flex items-center justify-center shadow-md font-mono border-4 border-white">
                {getInitials(formData.employee_name)}
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{formData.employee_name}</h3>
                <p className="text-xs text-indigo-600 font-semibold">{formData.designation}</p>
                <p className="text-[11px] text-slate-500">{formData.department}</p>
              </div>

              <div className="w-full p-2.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-700 flex justify-around">
                <div>
                  <span className="block text-[9px] text-slate-400">EMP ID</span>
                  <strong>{formData.name}</strong>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400">LOC</span>
                  <strong>{formData.work_location?.split(' ')[0]}</strong>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400">BLOOD</span>
                  <strong>{formData.blood_group}</strong>
                </div>
              </div>

              {/* Mock Barcode */}
              <div className="w-full pt-2">
                <div className="h-8 bg-slate-800 rounded flex items-center justify-around px-2">
                  <div className="h-full w-1 bg-white opacity-80" />
                  <div className="h-full w-2 bg-white opacity-90" />
                  <div className="h-full w-0.5 bg-white opacity-60" />
                  <div className="h-full w-3 bg-white opacity-90" />
                  <div className="h-full w-1 bg-white opacity-70" />
                  <div className="h-full w-2 bg-white opacity-90" />
                  <div className="h-full w-0.5 bg-white opacity-50" />
                  <div className="h-full w-1.5 bg-white opacity-80" />
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-1">AETHER-INTERNAL-AUTH-RFID</div>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Print Identity Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INSTANT LEAVE REQUEST */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Leave Request Dossier</h3>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                <span>Available Leave Entitlement:</span>
                <span className="font-mono font-bold text-indigo-900 text-sm">{formData.leave_balance} Days</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Medical / Sick Leave</option>
                  <option value="Special Family Care">Compassionate & Family Care</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Commencement Date</label>
                  <input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Number of Days</label>
                  <input
                    type="number"
                    min="1"
                    max={formData.leave_balance || 12}
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Reason & Justification</label>
                <textarea
                  rows={2}
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Provide justification or documentation details..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyLeave}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
                >
                  Submit Leave Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
