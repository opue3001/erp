import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Building2, 
  BarChart3, 
  CheckSquare, 
  ArrowUpRight, 
  X,
  Save,
  Filter
} from 'lucide-react';
import { frappeDB } from '../../framework/db';
import { ProjectDoc, TaskDoc, TimesheetDoc, BaseDoc } from '../../types/erp';

interface ProjectDashboardProps {
  onSelectDocType: (doctype: string) => void;
  onOpenDoc: (doctype: string, docName: string) => void;
  onNewDoc: (doctype: string) => void;
  onNavigateToTasks?: (projectId?: string) => void;
  onNavigateToTimesheets?: (projectId?: string) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  onSelectDocType,
  onOpenDoc,
  onNewDoc,
  onNavigateToTasks,
  onNavigateToTimesheets,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeProjectDetail, setActiveProjectDetail] = useState<ProjectDoc | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // New Project Form State
  const [newProjData, setNewProjData] = useState<Partial<ProjectDoc>>({
    project_name: '',
    status: 'In Progress',
    priority: 'Medium',
    project_type: 'Client Work',
    customer: 'Helios Semiconductor Corp',
    project_manager: 'Dr. Marcus Sterling',
    expected_start_date: new Date().toISOString().substring(0, 10),
    expected_end_date: new Date(Date.now() + 60 * 86400000).toISOString().substring(0, 10),
    estimated_cost: 65000,
    actual_cost: 0,
    percent_complete: 10,
    notes: '',
  });

  const projects = (frappeDB.get_list('Project') || []) as ProjectDoc[];
  const tasks = (frappeDB.get_list('Task') || []) as TaskDoc[];
  const timesheets = (frappeDB.get_list('Timesheet') || []) as TimesheetDoc[];
  const employees = frappeDB.get_list('Employee');
  const customers = frappeDB.get_list('Customer');

  // Metrics
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter((p) => p.status === 'In Progress').length;
  const completedProjects = projects.filter((p) => p.status === 'Completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.estimated_cost) || 0), 0);
  const totalActualCost = projects.reduce((sum, p) => sum + (Number(p.actual_cost) || 0), 0);
  const avgProgress = totalProjects > 0 ? Math.round(projects.reduce((sum, p) => sum + (Number(p.percent_complete) || 0), 0) / totalProjects) : 0;

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch = 
        !searchQuery ||
        p.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project_manager?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.customer?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = selectedStatus === 'All' || p.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [projects, searchQuery, selectedStatus]);

  // Priority badge styling
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Status badge styling
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'On Hold':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Open':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleCreateProject = () => {
    if (!newProjData.project_name?.trim()) {
      alert('Please specify a project name');
      return;
    }
    const created = frappeDB.insert({
      doctype: 'Project',
      ...newProjData,
    } as any);
    setShowNewProjectModal(false);
    setActiveProjectDetail(created as ProjectDoc);
  };

  const handleUpdateProjectProgress = (proj: ProjectDoc, newProgress: number) => {
    const updated = frappeDB.set_value('Project', proj.name, 'percent_complete', newProgress);
    if (newProgress >= 100) {
      frappeDB.set_value('Project', proj.name, 'status', 'Completed');
    }
    setActiveProjectDetail(updated as ProjectDoc);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>ERP Modules</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Project Operations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-indigo-600" />
            <span>Detail Project & Operations Hub</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track enterprise project delivery, budgets, milestone execution, task status, and real-time labor utilization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalProjects} Portfolios
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-indigo-600 font-semibold">{inProgressProjects} In Progress</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-semibold">{completedProjects} Done</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Portfolio Progress</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {avgProgress}% Average
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Budget Commitment</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalBudget.toLocaleString('en-US')}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span>Actual Spend: <strong>${totalActualCost.toLocaleString('en-US')}</strong></span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Active Tasks</span>
            <CheckSquare className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {tasks.length} Work Items
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-indigo-600 font-semibold">{timesheets.length} Timesheets Logged</span>
          </div>
        </div>
      </div>

      {/* Projects Directory & Detail Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-4">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Enterprise Projects Portfolio</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                {filteredProjects.length} of {projects.length} Projects
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any project row to view its 360° overview, linked tasks, budget utilization, and labor timesheets.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project, manager, client..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 w-60"
              />
            </div>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="px-6 flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {['All', 'In Progress', 'Completed', 'Open', 'On Hold'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Project Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-6">Project Name & ID</th>
                <th className="py-3 px-4">Status & Priority</th>
                <th className="py-3 px-4">Project Manager</th>
                <th className="py-3 px-4">Client / Type</th>
                <th className="py-3 px-4 text-center">Progress (%)</th>
                <th className="py-3 px-4 text-right">Budget ($)</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                    No projects found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const projTasks = tasks.filter((t) => t.project === p.name);
                  const completedTasksCount = projTasks.filter((t) => t.status === 'Completed').length;

                  return (
                    <tr
                      key={p.name}
                      onClick={() => setActiveProjectDetail(p)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <span>{p.project_name}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{p.name}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-500">{completedTasksCount}/{projTasks.length} Tasks</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(p.status)}`}>
                            {p.status}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityBadge(p.priority)}`}>
                            {p.priority}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center font-mono">
                            {p.project_manager?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{p.project_manager}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <div className="font-medium text-slate-900">{p.customer || 'Internal Corporate'}</div>
                        <div className="text-[10px] text-slate-400">{p.project_type}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                p.percent_complete >= 80 ? 'bg-emerald-500' : p.percent_complete >= 40 ? 'bg-indigo-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${p.percent_complete || 0}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {p.percent_complete || 0}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        ${Number(p.estimated_cost || 0).toLocaleString('en-US')}
                        <div className="text-[10px] text-slate-400 font-normal font-sans">
                          Spend: ${Number(p.actual_cost || 0).toLocaleString('en-US')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        <div>End: {p.expected_end_date}</div>
                        <div className="text-[10px] text-slate-400">Start: {p.expected_start_date}</div>
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProjectDetail(p);
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-flex items-center gap-1 group-hover:shadow-xs"
                        >
                          <span>Detail 360°</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROJECT 360° DETAIL MODAL / DRAWER */}
      {activeProjectDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeProjectDetail.name}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(activeProjectDetail.status)}`}>
                    {activeProjectDetail.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {activeProjectDetail.project_type}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {activeProjectDetail.project_name}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenDoc('Project', activeProjectDetail.name)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10 flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Standard DocForm</span>
                </button>
                <button
                  onClick={() => setActiveProjectDetail(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs bg-slate-50">
              
              {/* Progress & Milestone Controller */}
              <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm">Overall Delivery Progress</div>
                  <span className="font-mono font-bold text-indigo-600 text-base">
                    {activeProjectDetail.percent_complete}%
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${activeProjectDetail.percent_complete}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="text-slate-500 font-medium">Quick Update Progress:</span>
                  {[25, 50, 75, 100].map((prog) => (
                    <button
                      key={prog}
                      onClick={() => handleUpdateProjectProgress(activeProjectDetail, prog)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                        activeProjectDetail.percent_complete === prog
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {prog}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Ownership & Leadership</div>
                  <div className="flex items-center gap-2 pt-1">
                    <User className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold text-slate-900">{activeProjectDetail.project_manager}</div>
                      <div className="text-[11px] text-slate-500">Project Manager / Lead</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Client Account</div>
                  <div className="flex items-center gap-2 pt-1">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <div>
                      <div className="font-bold text-slate-900">{activeProjectDetail.customer || 'Internal Initiative'}</div>
                      <div className="text-[11px] text-slate-500">Billing Counterparty</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="text-slate-400 uppercase text-[10px] font-bold">Budget & Actual Spend</div>
                  <div className="flex items-center gap-2 pt-1">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold font-mono text-slate-900">
                        ${Number(activeProjectDetail.estimated_cost).toLocaleString()} Budget
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        ${Number(activeProjectDetail.actual_cost).toLocaleString()} Actual ({activeProjectDetail.total_billed_hours || 0} hrs billed)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Tasks Section */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Project Work Breakdown & Tasks</h3>
                  </div>
                  {onNavigateToTasks && (
                    <button
                      onClick={() => {
                        setActiveProjectDetail(null);
                        onNavigateToTasks(activeProjectDetail.name);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Open in Kanban Board</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {tasks.filter((t) => t.project === activeProjectDetail.name).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No tasks currently assigned to this project.
                    </div>
                  ) : (
                    tasks
                      .filter((t) => t.project === activeProjectDetail.name)
                      .map((t) => (
                        <div 
                          key={t.name}
                          onClick={() => onOpenDoc('Task', t.name)}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {t.status}
                            </span>
                            <div>
                              <div className="font-semibold text-slate-900">{t.title}</div>
                              <div className="text-[11px] text-slate-500 font-mono">Assigned to: {t.assigned_to || 'Unassigned'}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                            <span>{t.actual_hours || 0} / {t.expected_hours || 8} hrs</span>
                            <span className="font-bold text-slate-700">{t.progress || 0}%</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Linked Timesheets Section */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Timesheets & Labor Hours</h3>
                  </div>
                  {onNavigateToTimesheets && (
                    <button
                      onClick={() => {
                        setActiveProjectDetail(null);
                        onNavigateToTimesheets(activeProjectDetail.name);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Open Timesheet Workbench</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {timesheets.filter((ts) => ts.project === activeProjectDetail.name).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No timesheets logged for this project yet.
                    </div>
                  ) : (
                    timesheets
                      .filter((ts) => ts.project === activeProjectDetail.name)
                      .map((ts) => (
                        <div 
                          key={ts.name}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{ts.employee} · <span className="font-normal text-slate-600">{ts.activity_type}</span></div>
                            <div className="text-[11px] text-slate-500">{ts.notes || ts.task || 'General work'}</div>
                          </div>

                          <div className="text-right font-mono">
                            <div className="font-bold text-slate-900">{ts.hours} Hours</div>
                            <div className="text-[10px] text-emerald-600 font-semibold">${ts.total_billed_amount} ({ts.is_billable ? 'Billable' : 'Internal'})</div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Register New Project Dossier</h3>
              </div>
              <button onClick={() => setShowNewProjectModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Project Name *</label>
                <input
                  type="text"
                  value={newProjData.project_name}
                  onChange={(e) => setNewProjData({ ...newProjData, project_name: e.target.value })}
                  placeholder="e.g. Automated High-Concurrency Microservices"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Project Type</label>
                  <select
                    value={newProjData.project_type}
                    onChange={(e) => setNewProjData({ ...newProjData, project_type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Client Work">Client Work</option>
                    <option value="R&D">R&D</option>
                    <option value="Internal">Internal</option>
                    <option value="Infrastructure">Infrastructure</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={newProjData.priority}
                    onChange={(e) => setNewProjData({ ...newProjData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Project Manager</label>
                  <select
                    value={newProjData.project_manager}
                    onChange={(e) => setNewProjData({ ...newProjData, project_manager: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  >
                    {employees.map((emp) => (
                      <option key={emp.name} value={emp.employee_name}>
                        {emp.employee_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Customer Counterparty</label>
                  <select
                    value={newProjData.customer}
                    onChange={(e) => setNewProjData({ ...newProjData, customer: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="">-- Internal / Corporate --</option>
                    {customers.map((c) => (
                      <option key={c.name} value={c.customer_name}>
                        {c.customer_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    value={newProjData.expected_start_date}
                    onChange={(e) => setNewProjData({ ...newProjData, expected_start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    value={newProjData.expected_end_date}
                    onChange={(e) => setNewProjData({ ...newProjData, expected_end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Budget ($)</label>
                  <input
                    type="number"
                    value={newProjData.estimated_cost}
                    onChange={(e) => setNewProjData({ ...newProjData, estimated_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Scope of Work & Notes</label>
                <textarea
                  rows={2}
                  value={newProjData.notes}
                  onChange={(e) => setNewProjData({ ...newProjData, notes: e.target.value })}
                  placeholder="Key milestones, objectives, and deliverables..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Create Project</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
