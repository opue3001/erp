import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  User as UserIcon, 
  ChevronDown, 
  Terminal, 
  Boxes, 
  Globe2, 
  ShieldCheck, 
  Search,
  Check,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Landmark,
  Users,
  Cpu,
  BarChart3,
  FolderKanban
} from 'lucide-react';
import { User } from '../../types/erp';
import { SYSTEM_USERS, frappeAuth } from '../../framework/auth';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  onUserChanged: (user: User) => void;
  onOpenGlobalSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onUserChanged,
  onOpenGlobalSearch,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [dashboardsDropdownOpen, setDashboardsDropdownOpen] = useState(false);
  const dashboardsDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dashboardsDropdownRef.current && !dashboardsDropdownRef.current.contains(e.target as Node)) {
        setDashboardsDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchUser = (user: User) => {
    frappeAuth.switchUser(user.id);
    onUserChanged(user);
    setUserDropdownOpen(false);
  };

  const isAnyDashboardActive = 
    activeTab === 'workspace' || 
    activeTab.startsWith('dashboard_') || 
    activeTab.startsWith('project_');

  return (
    <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-6">
        <a 
          href="#workspace" 
          onClick={(e) => { e.preventDefault(); onSelectTab('workspace'); }}
          className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 hover:text-slate-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-sm">
            Æ
          </div>
          <span>AetherERP</span>
        </a>

        {/* Global Search Bar */}
        <button
          onClick={onOpenGlobalSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors border border-slate-200"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search documents or methods...</span>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-500 ml-3">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden xl:flex items-center gap-6 text-xs font-semibold text-slate-600">
        {/* Dashboards Dropdown */}
        <div className="relative" ref={dashboardsDropdownRef}>
          <button
            onClick={() => setDashboardsDropdownOpen(!dashboardsDropdownOpen)}
            className={`flex items-center gap-1.5 transition-colors pb-0.5 ${
              isAnyDashboardActive
                ? 'text-slate-950 font-bold border-b-2 border-slate-950'
                : 'hover:text-slate-950'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboards</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${dashboardsDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dashboardsDropdownOpen && (
            <div className="absolute left-0 mt-2.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Department Dashboard
              </div>

              <button
                onClick={() => { onSelectTab('workspace'); setDashboardsDropdownOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${
                  activeTab === 'workspace' ? 'bg-slate-100 font-bold text-slate-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-1 rounded-md bg-slate-900 text-white">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Master Workspace</div>
                  <div className="text-[10px] text-slate-400">Executive overview & cross-ledger</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => { onSelectTab('dashboard_sales'); setDashboardsDropdownOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${
                  activeTab === 'dashboard_sales' ? 'bg-indigo-50 font-bold text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-1 rounded-md bg-indigo-600 text-white">
                  <ShoppingCart className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Sales & CRM Dashboard</div>
                  <div className="text-[10px] text-slate-400">Revenue, orders & client metrics</div>
                </div>
              </button>

              <button
                onClick={() => { onSelectTab('dashboard_stock'); setDashboardsDropdownOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${
                  activeTab === 'dashboard_stock' ? 'bg-sky-50 font-bold text-sky-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-1 rounded-md bg-sky-600 text-white">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Stock & Inventory Dashboard</div>
                  <div className="text-[10px] text-slate-400">Valuation, alerts & SKUs</div>
                </div>
              </button>

              <button
                onClick={() => { onSelectTab('dashboard_accounting'); setDashboardsDropdownOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${
                  activeTab === 'dashboard_accounting' ? 'bg-amber-50 font-bold text-amber-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-1 rounded-md bg-amber-600 text-white">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Accounting & Books Dashboard</div>
                  <div className="text-[10px] text-slate-400">Receivables & double-entry journal</div>
                </div>
              </button>

              <button
                onClick={() => { onSelectTab('dashboard_hr'); setDashboardsDropdownOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${
                  activeTab === 'dashboard_hr' ? 'bg-emerald-50 font-bold text-emerald-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-1 rounded-md bg-emerald-600 text-white">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Human Resources Dashboard</div>
                  <div className="text-[10px] text-slate-400">Payroll, headcount & departments</div>
                </div>
              </button>

              <button
                onClick={() => { onSelectTab('project_detail'); setDashboardsDropdownOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${
                  activeTab === 'project_detail' || activeTab.startsWith('project_') ? 'bg-blue-50 font-bold text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-1 rounded-md bg-blue-600 text-white">
                  <FolderKanban className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Projects, Tasks & Timesheets</div>
                  <div className="text-[10px] text-slate-400">Delivery, sprints, hours & Gantt</div>
                </div>
              </button>

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => { onSelectTab('dashboard_framework'); setDashboardsDropdownOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-xs transition-colors ${
                  activeTab === 'dashboard_framework' ? 'bg-purple-50 font-bold text-purple-900' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-1 rounded-md bg-purple-600 text-white">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Architecture Hub</div>
                  <div className="text-[10px] text-slate-400">DB abstraction & engine status</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onSelectTab('doctype_Customer')}
          className={`transition-colors pb-0.5 ${
            activeTab.startsWith('doctype_') ? 'text-slate-950 font-bold border-b-2 border-slate-950' : 'hover:text-slate-950'
          }`}
        >
          ERP Records
        </button>
        <button
          onClick={() => onSelectTab('schema_builder')}
          className={`transition-colors pb-0.5 ${
            activeTab === 'schema_builder' ? 'text-slate-950 font-bold border-b-2 border-slate-950' : 'hover:text-slate-950'
          }`}
        >
          DocType Architect
        </button>
        <button
          onClick={() => onSelectTab('rest_api')}
          className={`transition-colors pb-0.5 ${
            activeTab === 'rest_api' ? 'text-slate-950 font-bold border-b-2 border-slate-950' : 'hover:text-slate-950'
          }`}
        >
          REST API Explorer
        </button>
        <button
          onClick={() => onSelectTab('python_console')}
          className={`transition-colors pb-0.5 ${
            activeTab === 'python_console' ? 'text-slate-950 font-bold border-b-2 border-slate-950' : 'hover:text-slate-950'
          }`}
        >
          Python & JS Console
        </button>
        <button
          onClick={() => onSelectTab('vue_ui')}
          className={`transition-colors pb-0.5 ${
            activeTab === 'vue_ui' ? 'text-slate-950 font-bold border-b-2 border-slate-950' : 'hover:text-slate-950'
          }`}
        >
          Vue UI Library
        </button>
        <button
          onClick={() => onSelectTab('permissions')}
          className={`transition-colors pb-0.5 ${
            activeTab === 'permissions' ? 'text-slate-950 font-bold border-b-2 border-slate-950' : 'hover:text-slate-950'
          }`}
        >
          Permissions
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions (User switcher & active role indicator) */}
      <div className="flex items-center gap-3 relative" ref={userDropdownRef}>
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              {currentUser.full_name[0]}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {currentUser.full_name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-none">
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {/* User & Role Dropdown */}
          {userDropdownOpen && (
            <div 
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              onMouseLeave={() => setUserDropdownOpen(false)}
            >
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Role-Based Access Control
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Switch active user to test real permission gates:
                </p>
              </div>

              <div className="py-1">
                {SYSTEM_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitchUser(user)}
                    className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-900">{user.full_name}</div>
                      <div className="text-[11px] text-slate-500">{user.role} · {user.department}</div>
                    </div>
                    {user.id === currentUser.id && (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
