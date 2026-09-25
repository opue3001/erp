export type DocFieldType =
  | 'Data'
  | 'Int'
  | 'Float'
  | 'Currency'
  | 'Date'
  | 'Select'
  | 'Link'
  | 'Check'
  | 'Text'
  | 'Table';

export interface DocField {
  fieldname: string;
  label: string;
  fieldtype: DocFieldType;
  options?: string; // Link target doctype or comma-separated select options
  reqd?: boolean;
  read_only?: boolean;
  default?: any;
  description?: string;
  in_list_view?: boolean;
  child_fields?: DocField[]; // For Table fieldtype
}

export interface DocPerm {
  role: string;
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
  submit: boolean;
  cancel: boolean;
}

export interface DocTypeMeta {
  name: string;
  module: 'Core' | 'Sales' | 'Stock' | 'Accounting' | 'HR' | 'Projects' | 'Custom';
  description: string;
  is_submittable?: boolean;
  autoname_prefix: string;
  title_field: string;
  fields: DocField[];
  permissions: DocPerm[];
  python_controller?: string;
}

export interface BaseDoc {
  name: string;
  doctype: string;
  owner: string;
  creation: string;
  modified: string;
  docstatus: 0 | 1 | 2; // 0: Draft, 1: Submitted, 2: Cancelled
  [key: string]: any;
}

export interface ProjectDoc extends BaseDoc {
  project_name: string;
  status: 'Open' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  project_type: 'Internal' | 'Client Work' | 'R&D' | 'Infrastructure';
  customer?: string;
  project_manager: string;
  expected_start_date: string;
  expected_end_date: string;
  estimated_cost: number;
  actual_cost: number;
  percent_complete: number;
  total_billed_hours?: number;
  notes?: string;
}

export interface TaskDoc extends BaseDoc {
  title: string;
  project: string;
  status: 'Backlog' | 'Todo' | 'In Progress' | 'Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigned_to?: string;
  expected_hours?: number;
  actual_hours?: number;
  start_date?: string;
  due_date?: string;
  progress?: number;
  description?: string;
}

export interface TimesheetDoc extends BaseDoc {
  employee: string;
  project: string;
  task?: string;
  start_date: string;
  hours: number;
  is_billable: boolean;
  billing_rate: number;
  total_billed_amount: number;
  activity_type: string;
  notes?: string;
  week_ending?: string;
  status?: string;
  job?: string;
  position?: string;
  job_id?: string;
  total_normal_hours?: number;
  total_overtime_hours?: number;
  normal_hours?: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
  };
  overtime_hours?: {
    sun: number;
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
  };
  description?: string;
}

export interface EmployeeDoc extends BaseDoc {
  employee_name: string;
  first_name?: string;
  last_name?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  date_of_birth?: string;
  marital_status?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  blood_group?: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  identification_id?: string;
  department: string;
  designation: string;
  employment_type: string;
  status: 'Active' | 'On Leave' | 'Probation' | 'Terminated' | 'Resigned';
  date_of_joining: string;
  confirmation_date?: string;
  reports_to?: string;
  work_location?: string;
  grade?: string;
  company_email?: string;
  personal_email?: string;
  cell_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_address?: string;
  monthly_salary: number;
  allowance_housing?: number;
  allowance_transport_meal?: number;
  deduction_tax_health?: number;
  bank_name?: string;
  bank_account_no?: string;
  bank_account_name?: string;
  leave_balance?: number;
  leaves_taken?: number;
  attendance_rate?: number;
  skills?: string;
  education?: string;
  performance_rating?: number;
  bio_notes?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'System Manager' | 'Sales Manager' | 'Accounts Manager' | 'Stock User' | 'HR Manager';
  avatar_url?: string;
  department: string;
}

export interface RestEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: 'Resource' | 'Method' | 'Auth';
  title: string;
  description: string;
  defaultParams?: Record<string, string>;
  defaultPayload?: any;
}

export interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  elapsedMs: number;
  data: T;
  timestamp: string;
}
