import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  FolderKanban, 
  ChevronRight, 
  X, 
  Save, 
  LayoutGrid, 
  List, 
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { frappeDB } from '../../framework/db';
import { TaskDoc, ProjectDoc, EmployeeDoc } from '../../types/erp';

interface TaskBoardViewProps {
  initialProjectId?: string;
  onOpenDoc: (doctype: string, docName: string) => void;
  onNewDoc: (doctype: string) => void;
  onNavigateToProjects?: () => void;
}

const STAGES: Array<TaskDoc['status']> = ['Backlog', 'Todo', 'In Progress', 'Review', 'Completed'];

export const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  initialProjectId,
  onOpenDoc,
  onNewDoc,
  onNavigateToProjects,
}) => {
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New Task form state
  const [newTaskData, setNewTaskData] = useState<Partial<TaskDoc>>({
    title: '',
    project: initialProjectId || 'PROJ-2026-001',
    status: 'Todo',
    priority: 'Medium',
    assigned_to: 'Dr. Marcus Sterling',
    expected_hours: 8,
    actual_hours: 0,
    start_date: new Date().toISOString().substring(0, 10),
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 10),
    progress: 0,
    description: '',
  });

  const tasks = (frappeDB.get_list('Task') || []) as TaskDoc[];
  const projects = (frappeDB.get_list('Project') || []) as ProjectDoc[];
  const employees = (frappeDB.get_list('Employee') || []) as EmployeeDoc[];

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchProject = selectedProject === 'All' || t.project === selectedProject;
      const matchSearch =
        !searchQuery ||
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.project?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchProject && matchSearch;
    });
  }, [tasks, selectedProject, searchQuery]);

  const handleAdvanceStatus = (task: TaskDoc, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = STAGES.indexOf(task.status);
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1];
      const nextProgress = nextStage === 'Completed' ? 100 : Math.max(task.progress || 0, (currentIndex + 1) * 25);
      frappeDB.set_value('Task', task.name, 'status', nextStage);
      frappeDB.set_value('Task', task.name, 'progress', nextProgress);
    }
  };

  const handleCreateTask = () => {
    if (!newTaskData.title?.trim()) {
      alert('Task title is required');
      return;
    }
    frappeDB.insert({
      doctype: 'Task',
      ...newTaskData,
    } as any);
    setShowNewTaskModal(false);
  };

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
            <span className="font-semibold text-slate-700">Task Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            <span>Task Kanban & Execution Board</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage sprint deliverables, task progression, assignee workloads, and completion stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-200/80 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Table</span>
            </button>
          </div>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Filter Project:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:outline-none focus:border-slate-400 text-slate-800"
            >
              <option value="All">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} - {p.project_name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-300 hidden sm:inline">|</span>

          <span className="text-xs text-slate-500 font-mono">
            {filteredTasks.length} Work Items
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search task title, assignee, project..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-400 w-64"
          />
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageTasks = filteredTasks.filter((t) => t.status === stage);

            return (
              <div 
                key={stage}
                className="bg-slate-100/70 border border-slate-200/80 rounded-xl p-3 flex flex-col min-w-[240px] max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{stage}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-600 font-bold border border-slate-200">
                      {stageTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setNewTaskData((prev) => ({ ...prev, status: stage }));
                      setShowNewTaskModal(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors"
                    title={`Add task to ${stage}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {stageTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/40">
                      No tasks in {stage}
                    </div>
                  ) : (
                    stageTasks.map((task) => (
                      <div
                        key={task.name}
                        onClick={() => onOpenDoc('Task', task.name)}
                        className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all cursor-pointer space-y-2.5 group"
                      >
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {task.project}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                          {task.title}
                        </h4>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span>Progress</span>
                            <span>{task.progress || 0}%</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                task.status === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${task.progress || 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                          <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                            <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center shrink-0 font-mono">
                              {task.assigned_to?.substring(0, 2).toUpperCase() || 'UN'}
                            </div>
                            <span className="truncate text-slate-700">{task.assigned_to || 'Unassigned'}</span>
                          </div>

                          {task.status !== 'Completed' && (
                            <button
                              onClick={(e) => handleAdvanceStatus(task, e)}
                              title="Advance to next status"
                              className="p-1 rounded bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-6">Task Title & ID</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Assigned Engineer</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                  <th className="py-3 px-4">Hours (Act / Est)</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                      No tasks matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr
                      key={t.name}
                      onClick={() => onOpenDoc('Task', t.name)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{t.title}</div>
                        <div className="text-[10px] font-mono text-slate-400">{t.name}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                        {t.project}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          t.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                        {t.assigned_to || 'Unassigned'}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono font-bold text-slate-800">
                        {t.progress || 0}%
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                        {t.actual_hours || 0} / {t.expected_hours || 8} hrs
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500">
                        {t.due_date || '-'}
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDoc('Task', t.name);
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
      )}

      {/* CREATE NEW TASK MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">Create New Project Task</h3>
              </div>
              <button onClick={() => setShowNewTaskModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                  placeholder="e.g. Implement schema migration script"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Project *</label>
                  <select
                    value={newTaskData.project}
                    onChange={(e) => setNewTaskData({ ...newTaskData, project: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    {projects.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name} - {p.project_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Initial Stage</label>
                  <select
                    value={newTaskData.status}
                    onChange={(e) => setNewTaskData({ ...newTaskData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  >
                    {STAGES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Assigned Engineer</label>
                  <select
                    value={newTaskData.assigned_to}
                    onChange={(e) => setNewTaskData({ ...newTaskData, assigned_to: e.target.value })}
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
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value as any })}
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
                  <label className="font-semibold text-slate-700">Estimated Hours</label>
                  <input
                    type="number"
                    value={newTaskData.expected_hours}
                    onChange={(e) => setNewTaskData({ ...newTaskData, expected_hours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={newTaskData.due_date}
                    onChange={(e) => setNewTaskData({ ...newTaskData, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Description / Requirements</label>
                <textarea
                  rows={2}
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                  placeholder="Task scope and deliverables..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Create Task</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
