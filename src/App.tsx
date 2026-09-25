import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { WorkspaceDashboard } from './components/desk/WorkspaceDashboard';
import { DocTypeListView } from './components/desk/DocTypeListView';
import { DocTypeFormModal } from './components/desk/DocTypeFormModal';
import { EmployeeDetailModal } from './components/desk/EmployeeDetailModal';
import { CreateTimesheetModal } from './components/desk/CreateTimesheetModal';
import { PrintPreviewModal } from './components/desk/PrintPreviewModal';
import { DocTypeBuilder } from './components/framework/DocTypeBuilder';
import { RestApiExplorer } from './components/framework/RestApiExplorer';
import { PythonConsole } from './components/framework/PythonConsole';
import { VueComponentLibrary } from './components/framework/VueComponentLibrary';
import { PermissionManager } from './components/framework/PermissionManager';
import { GlobalSearchModal } from './components/desk/GlobalSearchModal';
import { SalesDashboard } from './components/dashboards/SalesDashboard';
import { StockDashboard } from './components/dashboards/StockDashboard';
import { AccountingDashboard } from './components/dashboards/AccountingDashboard';
import { HRDashboard } from './components/dashboards/HRDashboard';
import { FrameworkDashboard } from './components/dashboards/FrameworkDashboard';
import { ProjectDashboard } from './components/dashboards/ProjectDashboard';
import { TaskBoardView } from './components/dashboards/TaskBoardView';
import { TimesheetView } from './components/dashboards/TimesheetView';
import { frappeDB } from './framework/db';
import { frappeAuth } from './framework/auth';
import { DocTypeMeta, BaseDoc, User } from './types/erp';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => frappeAuth.getCurrentUser());
  const [activeTab, setActiveTab] = useState<string>('workspace');
  const [docTypes, setDocTypes] = useState<DocTypeMeta[]>(() => frappeDB.get_all_doctypes());

  // Modal states
  const [activeDocModal, setActiveDocModal] = useState<{
    meta: DocTypeMeta;
    docName: string | null;
  } | null>(null);

  const [printPreviewDoc, setPrintPreviewDoc] = useState<BaseDoc | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Subscribe to DB changes & Auth changes
  useEffect(() => {
    const unsubDB = frappeDB.subscribe(() => {
      setDocTypes(frappeDB.get_all_doctypes());
    });
    const unsubAuth = frappeAuth.subscribe((u) => {
      setCurrentUser(u);
    });
    return () => {
      unsubDB();
      unsubAuth();
    };
  }, []);

  // Global keydown for search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleOpenDoc = (doctypeName: string, docName: string) => {
    const meta = frappeDB.get_doctype(doctypeName);
    if (meta) {
      setActiveDocModal({ meta, docName });
    }
  };

  const handleNewDoc = (doctypeName: string) => {
    const meta = frappeDB.get_doctype(doctypeName);
    if (meta) {
      setActiveDocModal({ meta, docName: null });
    }
  };

  const handleDocTypeCreated = (newMeta: DocTypeMeta) => {
    setActiveTab(`doctype_${newMeta.name}`);
  };

  // Determine current active DocType if on a list view
  const currentDocTypeName = activeTab.startsWith('doctype_')
    ? activeTab.replace('doctype_', '')
    : null;
  const currentDocTypeMeta = currentDocTypeName
    ? docTypes.find((d) => d.name === currentDocTypeName)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 select-auto">
      {/* Top 3-Zone Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onUserChanged={setCurrentUser}
        onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
      />

      {/* Main Workspace Frame: Sidebar + Content Canvas */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          docTypes={docTypes}
          onNewDoc={handleNewDoc}
        />

        <main className="flex-1 overflow-y-auto bg-slate-50">
          {activeTab === 'workspace' && (
            <WorkspaceDashboard
              onSelectDocType={(dt) => setActiveTab(`doctype_${dt}`)}
              onNewDoc={handleNewDoc}
              onSelectTab={setActiveTab}
            />
          )}

          {activeTab === 'dashboard_sales' && (
            <SalesDashboard
              onSelectDocType={(dt) => setActiveTab(`doctype_${dt}`)}
              onOpenDoc={handleOpenDoc}
              onNewDoc={handleNewDoc}
            />
          )}

          {activeTab === 'dashboard_stock' && (
            <StockDashboard
              onSelectDocType={(dt) => setActiveTab(`doctype_${dt}`)}
              onOpenDoc={handleOpenDoc}
              onNewDoc={handleNewDoc}
              onOpenRPC={() => setActiveTab('rest_api')}
            />
          )}

          {activeTab === 'dashboard_accounting' && (
            <AccountingDashboard
              onSelectDocType={(dt) => setActiveTab(`doctype_${dt}`)}
              onOpenDoc={handleOpenDoc}
              onNewDoc={handleNewDoc}
            />
          )}

          {activeTab === 'dashboard_hr' && (
            <HRDashboard
              onSelectDocType={(dt) => setActiveTab(`doctype_${dt}`)}
              onOpenDoc={handleOpenDoc}
              onNewDoc={handleNewDoc}
            />
          )}

          {(activeTab === 'dashboard_project' || activeTab === 'project_detail') && (
            <ProjectDashboard
              onSelectDocType={(dt) => setActiveTab(`doctype_${dt}`)}
              onOpenDoc={handleOpenDoc}
              onNewDoc={handleNewDoc}
              onNavigateToTasks={(projId) => {
                setActiveTab('project_tasks');
              }}
              onNavigateToTimesheets={(projId) => {
                setActiveTab('project_timesheets');
              }}
            />
          )}

          {activeTab === 'project_tasks' && (
            <TaskBoardView
              onOpenDoc={handleOpenDoc}
              onNewDoc={handleNewDoc}
              onNavigateToProjects={() => setActiveTab('project_detail')}
            />
          )}

          {activeTab === 'project_timesheets' && (
            <TimesheetView
              onOpenDoc={handleOpenDoc}
              onNewDoc={handleNewDoc}
            />
          )}

          {activeTab === 'dashboard_framework' && (
            <FrameworkDashboard onSelectTab={setActiveTab} />
          )}

          {currentDocTypeMeta && (
            <DocTypeListView
              meta={currentDocTypeMeta}
              currentUser={currentUser}
              onOpenDoc={handleOpenDoc}
              onNewDoc={handleNewDoc}
            />
          )}

          {activeTab === 'schema_builder' && (
            <DocTypeBuilder onDocTypeCreated={handleDocTypeCreated} />
          )}

          {activeTab === 'rest_api' && <RestApiExplorer />}

          {activeTab === 'python_console' && <PythonConsole />}

          {activeTab === 'vue_ui' && <VueComponentLibrary />}

          {activeTab === 'permissions' && (
            <PermissionManager
              currentUser={currentUser}
              onUserChanged={setCurrentUser}
            />
          )}
        </main>
      </div>

      {/* Document Form Modal (View / Edit / Submit / Cancel) */}
      {activeDocModal && activeDocModal.meta.name === 'Employee' ? (
        <EmployeeDetailModal
          docName={activeDocModal.docName}
          currentUser={currentUser}
          onClose={() => setActiveDocModal(null)}
          onSaved={() => {
            // refresh happens automatically via DB subscription
          }}
        />
      ) : activeDocModal && activeDocModal.meta.name === 'Timesheet' ? (
        <CreateTimesheetModal
          isOpen={true}
          onClose={() => setActiveDocModal(null)}
          onSaved={() => {
            setActiveDocModal(null);
          }}
        />
      ) : activeDocModal && (
        <DocTypeFormModal
          meta={activeDocModal.meta}
          docName={activeDocModal.docName}
          currentUser={currentUser}
          onClose={() => setActiveDocModal(null)}
          onSaved={() => {
            // refresh happens automatically via DB subscription
          }}
          onOpenPrintPreview={(doc) => {
            setPrintPreviewDoc(doc);
          }}
        />
      )}

      {/* Print Preview & Letterhead Modal */}
      {printPreviewDoc && (
        <PrintPreviewModal
          doc={printPreviewDoc}
          onClose={() => setPrintPreviewDoc(null)}
        />
      )}

      {/* Global Command Palette (⌘K) */}
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onSelectDoc={handleOpenDoc}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
