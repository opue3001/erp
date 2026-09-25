import { User, DocPerm } from '../types/erp';
import { frappeDB } from './db';

export const SYSTEM_USERS: User[] = [
  {
    id: 'usr_admin',
    email: 'admin@aether-erp.internal',
    full_name: 'Administrator',
    role: 'System Manager',
    department: 'Executive Office',
  },
  {
    id: 'usr_sales',
    email: 'alex.vance@aether-erp.internal',
    full_name: 'Alex Vance',
    role: 'Sales Manager',
    department: 'Sales & Distribution',
  },
  {
    id: 'usr_accounts',
    email: 'sarah.lin@aether-erp.internal',
    full_name: 'Sarah Lin',
    role: 'Accounts Manager',
    department: 'Finance & Accounting',
  },
  {
    id: 'usr_stock',
    email: 'carlos.gomez@aether-erp.internal',
    full_name: 'Carlos Gomez',
    role: 'Stock User',
    department: 'Logistics & Warehousing',
  },
  {
    id: 'usr_hr',
    email: 'priya.patel@aether-erp.internal',
    full_name: 'Priya Patel',
    role: 'HR Manager',
    department: 'People Operations',
  },
];

const STORAGE_KEY_AUTH = 'aether_erp_auth_user_v1';

class AuthSessionManager {
  private currentUser: User = SYSTEM_USERS[0];
  private authToken: string = 'token_adm_session_live_9981a';
  private listeners: Set<(user: User) => void> = new Set();

  constructor() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        const found = SYSTEM_USERS.find((u) => u.id === stored);
        if (found) this.currentUser = found;
      }
    } catch (e) {
      console.warn('Auth load fallback', e);
    }
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  public getAuthToken(): string {
    return this.authToken;
  }

  public subscribe(cb: (user: User) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, this.currentUser.id);
    } catch (e) {
      console.warn('Storage save failed', e);
    }
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  public switchUser(userId: string): User {
    const user = SYSTEM_USERS.find((u) => u.id === userId);
    if (!user) throw new Error(`User ${userId} not found`);
    this.currentUser = user;
    this.authToken = `token_${user.role.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`;
    this.notify();
    return user;
  }

  public loginWithCredentials(email: string): { success: boolean; user?: User; token?: string; error?: string } {
    const user = SYSTEM_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Invalid user credentials.' };
    }
    this.currentUser = user;
    this.authToken = `token_${user.role.toLowerCase().replace(/\s+/g, '_')}_${Date.now().toString(36)}`;
    this.notify();
    return { success: true, user, token: this.authToken };
  }

  public hasPermission(doctype: string, ptype: keyof Omit<DocPerm, 'role'>, user = this.currentUser): boolean {
    if (user.role === 'System Manager') return true;

    const meta = frappeDB.get_doctype(doctype);
    if (!meta) return false;

    const perm = meta.permissions.find((p) => p.role === user.role);
    if (!perm) return false;

    return !!perm[ptype];
  }

  public updateDocPerm(doctype: string, role: string, permUpdate: Partial<DocPerm>) {
    const meta = frappeDB.get_doctype(doctype);
    if (!meta) return;

    let perm = meta.permissions.find((p) => p.role === role);
    if (!perm) {
      perm = {
        role,
        read: false,
        write: false,
        create: false,
        delete: false,
        submit: false,
        cancel: false,
      };
      meta.permissions.push(perm);
    }

    Object.assign(perm, permUpdate);
    frappeDB.save_doctype(meta);
  }
}

export const frappeAuth = new AuthSessionManager();
