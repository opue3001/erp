import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Check, 
  Lock, 
  Unlock, 
  Users, 
  RefreshCw,
  Info
} from 'lucide-react';
import { frappeDB } from '../../framework/db';
import { frappeAuth, SYSTEM_USERS } from '../../framework/auth';
import { User, DocTypeMeta } from '../../types/erp';

interface PermissionManagerProps {
  currentUser: User;
  onUserChanged: (user: User) => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  currentUser,
  onUserChanged,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('Sales Manager');
  const [refreshKey, setRefreshKey] = useState(0);

  const doctypes = frappeDB.get_all_doctypes();

  const handleTogglePerm = (
    doctype: string,
    permKey: 'read' | 'write' | 'create' | 'delete' | 'submit' | 'cancel',
    currentVal: boolean
  ) => {
    frappeAuth.updateDocPerm(doctype, selectedRole, {
      [permKey]: !currentVal,
    });
    setRefreshKey((k) => k + 1);
  };

  const handleSwitchToRole = (roleName: string) => {
    const user = SYSTEM_USERS.find((u) => u.role === roleName);
    if (user) {
      frappeAuth.switchUser(user.id);
      onUserChanged(user);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Framework Engine</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Security & Authentication</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Role-Based Access Control (RBAC) Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure granular document permissions (Read, Write, Create, Delete, Submit, Cancel) across all system roles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span>Active Session:</span>
            <strong className="text-slate-900">{currentUser.full_name} ({currentUser.role})</strong>
          </div>
        </div>
      </div>

      {/* Role Selection bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
            Configuring Role:
          </span>
          {SYSTEM_USERS.map((u) => (
            <button
              key={u.role}
              onClick={() => setSelectedRole(u.role)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedRole === u.role
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {u.role}
            </button>
          ))}
        </div>

        <button
          onClick={() => handleSwitchToRole(selectedRole)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Switch Active User to {selectedRole}</span>
        </button>
      </div>

      {/* Permission Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="py-3 px-6 font-semibold">DocType Model</th>
                <th className="py-3 px-6 font-semibold">Module</th>
                <th className="py-3 px-4 font-semibold text-center">Read</th>
                <th className="py-3 px-4 font-semibold text-center">Write</th>
                <th className="py-3 px-4 font-semibold text-center">Create</th>
                <th className="py-3 px-4 font-semibold text-center">Delete</th>
                <th className="py-3 px-4 font-semibold text-center">Submit</th>
                <th className="py-3 px-4 font-semibold text-center">Cancel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctypes.map((dt) => {
                const perm = dt.permissions.find((p) => p.role === selectedRole) || {
                  role: selectedRole,
                  read: false,
                  write: false,
                  create: false,
                  delete: false,
                  submit: false,
                  cancel: false,
                };

                const isSystemManager = selectedRole === 'System Manager';

                return (
                  <tr key={dt.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-6 font-semibold text-slate-900">
                      {dt.name}
                    </td>
                    <td className="py-3 px-6 text-slate-500">
                      {dt.module}
                    </td>
                    {(['read', 'write', 'create', 'delete', 'submit', 'cancel'] as const).map((permKey) => {
                      const isAllowed = isSystemManager || !!perm[permKey];

                      return (
                        <td key={permKey} className="py-3 px-4 text-center">
                          <button
                            disabled={isSystemManager}
                            onClick={() => handleTogglePerm(dt.name, permKey, !!perm[permKey])}
                            className={`p-1.5 rounded-md transition-colors ${
                              isAllowed
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            } ${isSystemManager ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={isSystemManager ? 'System Manager has universal access' : `Toggle ${permKey}`}
                          >
                            {isAllowed ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            DocPerm rules are evaluated in real-time by both the UI Form controllers and the REST API server pipeline.
          </span>
        </div>
      </div>
    </div>
  );
};
