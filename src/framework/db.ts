import { DocTypeMeta, BaseDoc } from '../types/erp';

export const INITIAL_DOCTYPES: DocTypeMeta[] = [
  {
    name: 'Customer',
    module: 'Sales',
    description: 'Companies and individual clients purchasing goods or services',
    autoname_prefix: 'CUST-',
    title_field: 'customer_name',
    fields: [
      { fieldname: 'customer_name', label: 'Customer Name', fieldtype: 'Data', reqd: true, in_list_view: true },
      { fieldname: 'customer_type', label: 'Customer Type', fieldtype: 'Select', options: 'Company,Individual', default: 'Company', in_list_view: true },
      { fieldname: 'email_id', label: 'Email', fieldtype: 'Data', in_list_view: true },
      { fieldname: 'phone', label: 'Phone', fieldtype: 'Data' },
      { fieldname: 'territory', label: 'Territory', fieldtype: 'Select', options: 'North America,Europe,Asia Pacific,Latin America', default: 'North America', in_list_view: true },
      { fieldname: 'credit_limit', label: 'Credit Limit ($)', fieldtype: 'Currency', default: 50000 },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Active,Suspended,Pending', default: 'Active', in_list_view: true },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'Sales Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'Accounts Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Stock User', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'HR Manager', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
    ],
    python_controller: `class Customer(Document):
    def validate(self):
        if self.credit_limit < 0:
            frappe.throw("Credit limit cannot be negative")
        if not self.email_id:
            frappe.msgprint("Warning: Email address is recommended for billing")`,
  },
  {
    name: 'Item',
    module: 'Stock',
    description: 'Inventory items, raw materials, or finished products',
    autoname_prefix: 'ITEM-',
    title_field: 'item_name',
    fields: [
      { fieldname: 'item_code', label: 'Item Code', fieldtype: 'Data', reqd: true, in_list_view: true },
      { fieldname: 'item_name', label: 'Item Name', fieldtype: 'Data', reqd: true, in_list_view: true },
      { fieldname: 'item_group', label: 'Item Group', fieldtype: 'Select', options: 'Hardware,Components,Assemblies,Software,Raw Materials', default: 'Hardware', in_list_view: true },
      { fieldname: 'stock_uom', label: 'Unit of Measure', fieldtype: 'Select', options: 'Nos,Kg,Meter,Liter,Box', default: 'Nos', in_list_view: true },
      { fieldname: 'standard_rate', label: 'Standard Selling Rate ($)', fieldtype: 'Currency', default: 100, in_list_view: true },
      { fieldname: 'valuation_rate', label: 'Valuation Rate ($)', fieldtype: 'Currency', default: 65 },
      { fieldname: 'total_qty', label: 'Current Stock', fieldtype: 'Float', default: 100, in_list_view: true, read_only: true },
      { fieldname: 'reorder_level', label: 'Reorder Level', fieldtype: 'Int', default: 20 },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'In Stock,Low Stock,Out of Stock', default: 'In Stock', in_list_view: true },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'Stock User', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'Sales Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Accounts Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'HR Manager', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
    ],
    python_controller: `class Item(Document):
    def before_save(self):
        if self.total_qty <= 0:
            self.status = "Out of Stock"
        elif self.total_qty <= self.reorder_level:
            self.status = "Low Stock"
        else:
            self.status = "In Stock"`,
  },
  {
    name: 'Sales Order',
    module: 'Sales',
    description: 'Confirmed sales contract with line items and delivery schedule',
    is_submittable: true,
    autoname_prefix: 'SO-',
    title_field: 'name',
    fields: [
      { fieldname: 'customer', label: 'Customer', fieldtype: 'Link', options: 'Customer', reqd: true, in_list_view: true },
      { fieldname: 'transaction_date', label: 'Date', fieldtype: 'Date', reqd: true, in_list_view: true },
      { fieldname: 'delivery_date', label: 'Delivery Date', fieldtype: 'Date', reqd: true },
      { fieldname: 'currency', label: 'Currency', fieldtype: 'Select', options: 'USD,EUR,GBP,JPY', default: 'USD' },
      { fieldname: 'items_summary', label: 'Items Ordered', fieldtype: 'Data', in_list_view: true },
      { fieldname: 'net_total', label: 'Net Total ($)', fieldtype: 'Currency', read_only: true },
      { fieldname: 'tax_amount', label: 'Tax (8%) ($)', fieldtype: 'Currency', read_only: true },
      { fieldname: 'grand_total', label: 'Grand Total ($)', fieldtype: 'Currency', reqd: true, in_list_view: true, read_only: true },
      { fieldname: 'workflow_state', label: 'Status', fieldtype: 'Select', options: 'Draft,Submitted,Delivered,Completed,Cancelled', default: 'Draft', in_list_view: true },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: true, cancel: true },
      { role: 'Sales Manager', read: true, write: true, create: true, delete: true, submit: true, cancel: true },
      { role: 'Accounts Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Stock User', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'HR Manager', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
    ],
    python_controller: `class SalesOrder(Document):
    def validate(self):
        self.tax_amount = round(self.net_total * 0.08, 2)
        self.grand_total = self.net_total + self.tax_amount

    def on_submit(self):
        self.workflow_state = "Submitted"
        frappe.msgprint(f"Sales Order {self.name} submitted successfully. Reserved stock updated.")

    def on_cancel(self):
        self.workflow_state = "Cancelled"`,
  },
  {
    name: 'Sales Invoice',
    module: 'Accounting',
    description: 'Official bill issued to customer for payment collection',
    is_submittable: true,
    autoname_prefix: 'SINV-',
    title_field: 'name',
    fields: [
      { fieldname: 'customer', label: 'Customer', fieldtype: 'Link', options: 'Customer', reqd: true, in_list_view: true },
      { fieldname: 'posting_date', label: 'Posting Date', fieldtype: 'Date', reqd: true, in_list_view: true },
      { fieldname: 'due_date', label: 'Due Date', fieldtype: 'Date', reqd: true },
      { fieldname: 'sales_order', label: 'Sales Order Ref', fieldtype: 'Link', options: 'Sales Order' },
      { fieldname: 'outstanding_amount', label: 'Outstanding ($)', fieldtype: 'Currency', in_list_view: true },
      { fieldname: 'grand_total', label: 'Total Billed ($)', fieldtype: 'Currency', reqd: true, in_list_view: true },
      { fieldname: 'payment_status', label: 'Payment Status', fieldtype: 'Select', options: 'Unpaid,Partially Paid,Paid,Overdue', default: 'Unpaid', in_list_view: true },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: true, cancel: true },
      { role: 'Accounts Manager', read: true, write: true, create: true, delete: true, submit: true, cancel: true },
      { role: 'Sales Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Stock User', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'HR Manager', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
    ],
    python_controller: `class SalesInvoice(Document):
    def on_submit(self):
        # Post to General Ledger (Dr Debtors, Cr Sales)
        make_gl_entries(self.name, self.customer, self.grand_total)
        frappe.db.set_value("Sales Invoice", self.name, "payment_status", "Unpaid")`,
  },
  {
    name: 'Stock Entry',
    module: 'Stock',
    description: 'Material receipt, issue, or warehouse transfer records',
    is_submittable: true,
    autoname_prefix: 'STE-',
    title_field: 'name',
    fields: [
      { fieldname: 'purpose', label: 'Purpose', fieldtype: 'Select', options: 'Material Receipt,Material Issue,Material Transfer', reqd: true, in_list_view: true },
      { fieldname: 'posting_date', label: 'Posting Date', fieldtype: 'Date', reqd: true, in_list_view: true },
      { fieldname: 'item_code', label: 'Item', fieldtype: 'Link', options: 'Item', reqd: true, in_list_view: true },
      { fieldname: 'qty', label: 'Quantity', fieldtype: 'Float', reqd: true, in_list_view: true },
      { fieldname: 'from_warehouse', label: 'Source Warehouse', fieldtype: 'Select', options: 'Stores,Finished Goods,WIP,Transit', default: 'Stores' },
      { fieldname: 'to_warehouse', label: 'Target Warehouse', fieldtype: 'Select', options: 'Stores,Finished Goods,WIP,Transit', default: 'Finished Goods', in_list_view: true },
      { fieldname: 'total_value', label: 'Total Value ($)', fieldtype: 'Currency', read_only: true, in_list_view: true },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: true, cancel: true },
      { role: 'Stock User', read: true, write: true, create: true, delete: true, submit: true, cancel: true },
      { role: 'Sales Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Accounts Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'HR Manager', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
    ],
    python_controller: `class StockEntry(Document):
    def on_submit(self):
        # Update Item total_qty
        item = frappe.get_doc("Item", self.item_code)
        if self.purpose == "Material Receipt":
            item.total_qty += self.qty
        elif self.purpose == "Material Issue":
            item.total_qty = max(0, item.total_qty - self.qty)
        item.save()`,
  },
  {
    name: 'Employee',
    module: 'HR',
    description: 'Internal personnel records, compensation structures, attendance, and organizational hierarchy',
    autoname_prefix: 'EMP-',
    title_field: 'employee_name',
    fields: [
      { fieldname: 'employee_name', label: 'Full Name', fieldtype: 'Data', reqd: true, in_list_view: true },
      { fieldname: 'company_email', label: 'Company Email', fieldtype: 'Data', in_list_view: true },
      { fieldname: 'cell_number', label: 'Phone Number', fieldtype: 'Data' },
      { fieldname: 'department', label: 'Department', fieldtype: 'Select', options: 'Engineering,Sales & Marketing,Finance & Accounting,Operations & Logistics,People & HR,Product & Design,Legal & Compliance', reqd: true, in_list_view: true },
      { fieldname: 'designation', label: 'Designation / Job Title', fieldtype: 'Data', reqd: true, in_list_view: true },
      { fieldname: 'grade', label: 'Grade / Level', fieldtype: 'Select', options: 'L1 - Associate,L2 - Specialist,L3 - Senior Engineer / Lead,L4 - Manager / Staff,L5 - Director / Executive', default: 'L3 - Senior Engineer / Lead' },
      { fieldname: 'employment_type', label: 'Employment Type', fieldtype: 'Select', options: 'Full-time,Contract,Part-time,Internship,Probation', default: 'Full-time' },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Active,On Leave,Probation,Terminated,Resigned', default: 'Active', in_list_view: true },
      { fieldname: 'date_of_joining', label: 'Date of Joining', fieldtype: 'Date', reqd: true, in_list_view: true },
      { fieldname: 'work_location', label: 'Work Location / Branch', fieldtype: 'Select', options: 'Headquarters,Tech Hub Silicon Valley,London Regional Office,Singapore Logistics Hub,Remote / WFH', default: 'Headquarters' },
      { fieldname: 'reports_to', label: 'Reports To (Supervisor)', fieldtype: 'Link', options: 'Employee' },
      { fieldname: 'monthly_salary', label: 'Monthly Base Salary ($)', fieldtype: 'Currency', reqd: true, in_list_view: true },
      { fieldname: 'allowance_housing', label: 'Housing Allowance ($)', fieldtype: 'Currency', default: 1200 },
      { fieldname: 'allowance_transport_meal', label: 'Transport & Meal ($)', fieldtype: 'Currency', default: 600 },
      { fieldname: 'deduction_tax_health', label: 'Tax & Health Deductions ($)', fieldtype: 'Currency', default: 950 },
      { fieldname: 'bank_name', label: 'Bank Name', fieldtype: 'Select', options: 'Bank Central Asia,Bank Mandiri,JPMorgan Chase,Citibank,HSBC,Barclays', default: 'JPMorgan Chase' },
      { fieldname: 'bank_account_no', label: 'Bank Account Number', fieldtype: 'Data' },
      { fieldname: 'bank_account_name', label: 'Account Holder Name', fieldtype: 'Data' },
      { fieldname: 'leave_balance', label: 'Leave Balance (Days)', fieldtype: 'Int', default: 12 },
      { fieldname: 'leaves_taken', label: 'Leaves Taken (Days)', fieldtype: 'Int', default: 2 },
      { fieldname: 'attendance_rate', label: 'Attendance Rate (%)', fieldtype: 'Float', default: 98.5 },
      { fieldname: 'gender', label: 'Gender', fieldtype: 'Select', options: 'Male,Female,Other,Prefer not to say', default: 'Female' },
      { fieldname: 'date_of_birth', label: 'Date of Birth', fieldtype: 'Date' },
      { fieldname: 'marital_status', label: 'Marital Status', fieldtype: 'Select', options: 'Single,Married,Divorced,Widowed', default: 'Single' },
      { fieldname: 'blood_group', label: 'Blood Group', fieldtype: 'Select', options: 'A+,A-,B+,B-,O+,O-,AB+,AB-', default: 'O+' },
      { fieldname: 'identification_id', label: 'National ID / SSN / KTP', fieldtype: 'Data' },
      { fieldname: 'personal_email', label: 'Personal Email', fieldtype: 'Data' },
      { fieldname: 'emergency_contact_name', label: 'Emergency Contact Name', fieldtype: 'Data' },
      { fieldname: 'emergency_contact_phone', label: 'Emergency Contact Phone', fieldtype: 'Data' },
      { fieldname: 'current_address', label: 'Residential Address', fieldtype: 'Text' },
      { fieldname: 'skills', label: 'Skills & Competencies', fieldtype: 'Text' },
      { fieldname: 'education', label: 'Education & Degree', fieldtype: 'Text' },
      { fieldname: 'performance_rating', label: 'Performance Rating (1-5)', fieldtype: 'Float', default: 4.8 },
      { fieldname: 'bio_notes', label: 'HR Notes & Summary', fieldtype: 'Text' },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'HR Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'Accounts Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Sales Manager', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Stock User', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
    ],
    python_controller: `class Employee(Document):
    def validate(self):
        if self.monthly_salary < 1000:
            frappe.throw("Salary must meet federal minimum scale ($1000)")
        if self.leave_balance < 0:
            frappe.throw("Leave balance cannot be negative")`,
  },
  {
    name: 'Journal Entry',
    module: 'Accounting',
    description: 'Double-entry general ledger voucher recording debits and credits',
    is_submittable: true,
    autoname_prefix: 'JV-',
    title_field: 'name',
    fields: [
      { fieldname: 'posting_date', label: 'Posting Date', fieldtype: 'Date', reqd: true, in_list_view: true },
      { fieldname: 'voucher_type', label: 'Voucher Type', fieldtype: 'Select', options: 'Journal Entry,Payment Entry,Receipt Entry,Opening Entry', default: 'Journal Entry', in_list_view: true },
      { fieldname: 'account_debit', label: 'Debit Account', fieldtype: 'Select', options: 'Bank Account,Accounts Receivable,Inventory Asset,Cost of Goods Sold,Salaries Expense', reqd: true, in_list_view: true },
      { fieldname: 'account_credit', label: 'Credit Account', fieldtype: 'Select', options: 'Accounts Payable,Sales Revenue,Bank Account,Retained Earnings', reqd: true, in_list_view: true },
      { fieldname: 'total_debit', label: 'Debit Amount ($)', fieldtype: 'Currency', reqd: true, in_list_view: true },
      { fieldname: 'total_credit', label: 'Credit Amount ($)', fieldtype: 'Currency', reqd: true, in_list_view: true },
      { fieldname: 'user_remark', label: 'Narration / Remarks', fieldtype: 'Text', in_list_view: true },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: true, cancel: true },
      { role: 'Accounts Manager', read: true, write: true, create: true, delete: true, submit: true, cancel: true },
      { role: 'Sales Manager', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Stock User', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'HR Manager', read: false, write: false, create: false, delete: false, submit: false, cancel: false },
    ],
    python_controller: `class JournalEntry(Document):
    def validate(self):
        if self.total_debit != self.total_credit:
            frappe.throw(f"Total Debit ($ {self.total_debit}) must equal Total Credit ($ {self.total_credit})")`,
  },
  {
    name: 'Project',
    module: 'Projects',
    description: 'Enterprise projects, delivery milestones, budgets, and operational progress tracking',
    autoname_prefix: 'PROJ-',
    title_field: 'project_name',
    fields: [
      { fieldname: 'project_name', label: 'Project Name', fieldtype: 'Data', reqd: true, in_list_view: true },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Open,In Progress,On Hold,Completed,Cancelled', default: 'In Progress', in_list_view: true },
      { fieldname: 'priority', label: 'Priority', fieldtype: 'Select', options: 'Low,Medium,High,Urgent', default: 'Medium', in_list_view: true },
      { fieldname: 'project_type', label: 'Project Type', fieldtype: 'Select', options: 'Internal,Client Work,R&D,Infrastructure', default: 'Client Work', in_list_view: true },
      { fieldname: 'customer', label: 'Customer', fieldtype: 'Link', options: 'Customer' },
      { fieldname: 'project_manager', label: 'Project Manager', fieldtype: 'Link', options: 'Employee', reqd: true, in_list_view: true },
      { fieldname: 'expected_start_date', label: 'Start Date', fieldtype: 'Date', reqd: true },
      { fieldname: 'expected_end_date', label: 'End Date', fieldtype: 'Date', reqd: true, in_list_view: true },
      { fieldname: 'estimated_cost', label: 'Estimated Budget ($)', fieldtype: 'Currency', default: 50000, in_list_view: true },
      { fieldname: 'actual_cost', label: 'Actual Cost ($)', fieldtype: 'Currency', default: 0 },
      { fieldname: 'percent_complete', label: 'Progress (%)', fieldtype: 'Float', default: 0, in_list_view: true },
      { fieldname: 'total_billed_hours', label: 'Total Billed Hours', fieldtype: 'Float', default: 0 },
      { fieldname: 'notes', label: 'Project Scope & Notes', fieldtype: 'Text' },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'Sales Manager', read: true, write: true, create: true, delete: false, submit: false, cancel: false },
      { role: 'Accounts Manager', read: true, write: true, create: false, delete: false, submit: false, cancel: false },
      { role: 'HR Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Stock User', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
    ],
    python_controller: `class Project(Document):
    def validate(self):
        if self.percent_complete < 0 or self.percent_complete > 100:
            frappe.throw("Percent complete must be between 0 and 100")`,
  },
  {
    name: 'Task',
    module: 'Projects',
    description: 'Work packages, deliverables, sprint tasks, and assignee execution boards',
    autoname_prefix: 'TASK-',
    title_field: 'title',
    fields: [
      { fieldname: 'title', label: 'Task Title', fieldtype: 'Data', reqd: true, in_list_view: true },
      { fieldname: 'project', label: 'Project', fieldtype: 'Link', options: 'Project', reqd: true, in_list_view: true },
      { fieldname: 'status', label: 'Status', fieldtype: 'Select', options: 'Backlog,Todo,In Progress,Review,Completed', default: 'Todo', in_list_view: true },
      { fieldname: 'priority', label: 'Priority', fieldtype: 'Select', options: 'Low,Medium,High,Urgent', default: 'Medium', in_list_view: true },
      { fieldname: 'assigned_to', label: 'Assigned To', fieldtype: 'Link', options: 'Employee', in_list_view: true },
      { fieldname: 'expected_hours', label: 'Estimated Hours', fieldtype: 'Float', default: 8 },
      { fieldname: 'actual_hours', label: 'Actual Hours', fieldtype: 'Float', default: 0 },
      { fieldname: 'start_date', label: 'Start Date', fieldtype: 'Date' },
      { fieldname: 'due_date', label: 'Due Date', fieldtype: 'Date', in_list_view: true },
      { fieldname: 'progress', label: 'Progress (%)', fieldtype: 'Float', default: 0 },
      { fieldname: 'description', label: 'Description & Acceptance Criteria', fieldtype: 'Text' },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'Sales Manager', read: true, write: true, create: true, delete: false, submit: false, cancel: false },
      { role: 'Accounts Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'HR Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Stock User', read: true, write: true, create: true, delete: false, submit: false, cancel: false },
    ],
  },
  {
    name: 'Timesheet',
    module: 'Projects',
    description: 'Direct labor logging, billable client hours, rate calculation, and project timesheets',
    autoname_prefix: 'TS-',
    title_field: 'name',
    fields: [
      { fieldname: 'employee', label: 'Employee', fieldtype: 'Link', options: 'Employee', reqd: true, in_list_view: true },
      { fieldname: 'project', label: 'Project', fieldtype: 'Link', options: 'Project', reqd: true, in_list_view: true },
      { fieldname: 'task', label: 'Task', fieldtype: 'Data', in_list_view: true },
      { fieldname: 'start_date', label: 'Date Logged', fieldtype: 'Date', reqd: true, in_list_view: true },
      { fieldname: 'hours', label: 'Logged Hours', fieldtype: 'Float', reqd: true, in_list_view: true },
      { fieldname: 'is_billable', label: 'Billable', fieldtype: 'Check', default: true, in_list_view: true },
      { fieldname: 'billing_rate', label: 'Billing Rate ($/hr)', fieldtype: 'Currency', default: 85 },
      { fieldname: 'total_billed_amount', label: 'Total Amount ($)', fieldtype: 'Currency', in_list_view: true },
      { fieldname: 'activity_type', label: 'Activity Type', fieldtype: 'Select', options: 'Software Development,Architecture Design,Quality Assurance,Project Management,Client Consultation,Code Review', default: 'Software Development', in_list_view: true },
      { fieldname: 'notes', label: 'Work Performed / Notes', fieldtype: 'Text' },
    ],
    permissions: [
      { role: 'System Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'HR Manager', read: true, write: true, create: true, delete: true, submit: false, cancel: false },
      { role: 'Accounts Manager', read: true, write: true, create: false, delete: false, submit: false, cancel: false },
      { role: 'Sales Manager', read: true, write: false, create: false, delete: false, submit: false, cancel: false },
      { role: 'Stock User', read: true, write: true, create: true, delete: false, submit: false, cancel: false },
    ],
  },
];

export const INITIAL_DOCUMENTS: Record<string, BaseDoc[]> = {
  Customer: [
    {
      name: 'CUST-0001',
      doctype: 'Customer',
      owner: 'Administrator',
      creation: '2026-03-01 09:30:00',
      modified: '2026-03-15 11:20:00',
      docstatus: 0,
      customer_name: 'Helios Semiconductor Corp',
      customer_type: 'Company',
      email_id: 'procurement@helios-semi.com',
      phone: '+1 (415) 890-2100',
      territory: 'North America',
      credit_limit: 150000,
      status: 'Active',
    },
    {
      name: 'CUST-0002',
      doctype: 'Customer',
      owner: 'Alex Vance',
      creation: '2026-03-02 14:15:00',
      modified: '2026-03-20 16:45:00',
      docstatus: 0,
      customer_name: 'AeroDynamic Propulsion Ltd',
      customer_type: 'Company',
      email_id: 'supply@aerodynamic-uk.co',
      phone: '+44 20 7946 0912',
      territory: 'Europe',
      credit_limit: 85000,
      status: 'Active',
    },
    {
      name: 'CUST-0003',
      doctype: 'Customer',
      owner: 'Alex Vance',
      creation: '2026-03-05 10:00:00',
      modified: '2026-03-22 09:12:00',
      docstatus: 0,
      customer_name: 'Kyoto Robotics Automation',
      customer_type: 'Company',
      email_id: 'orders@kyoto-robotics.jp',
      phone: '+81 75 321 8899',
      territory: 'Asia Pacific',
      credit_limit: 200000,
      status: 'Active',
    },
    {
      name: 'CUST-0004',
      doctype: 'Customer',
      owner: 'Administrator',
      creation: '2026-03-10 12:40:00',
      modified: '2026-03-10 12:40:00',
      docstatus: 0,
      customer_name: 'Dr. Elena Rostova',
      customer_type: 'Individual',
      email_id: 'elena.rostova@research-lab.org',
      phone: '+1 (650) 412-9981',
      territory: 'North America',
      credit_limit: 15000,
      status: 'Active',
    },
  ],
  Item: [
    {
      name: 'ITEM-0001',
      doctype: 'Item',
      owner: 'Carlos Gomez',
      creation: '2026-02-10 08:00:00',
      modified: '2026-03-24 10:11:00',
      docstatus: 0,
      item_code: 'NX-OPTIC-400',
      item_name: 'Precision Fiber Optical Transceiver 400G',
      item_group: 'Components',
      stock_uom: 'Nos',
      standard_rate: 680,
      valuation_rate: 420,
      total_qty: 145,
      reorder_level: 30,
      status: 'In Stock',
    },
    {
      name: 'ITEM-0002',
      doctype: 'Item',
      owner: 'Carlos Gomez',
      creation: '2026-02-12 11:30:00',
      modified: '2026-03-24 15:20:00',
      docstatus: 0,
      item_code: 'SERVO-ACT-24V',
      item_name: 'Industrial Micro-Servo Actuator 24V High Torque',
      item_group: 'Hardware',
      stock_uom: 'Nos',
      standard_rate: 340,
      valuation_rate: 210,
      total_qty: 24,
      reorder_level: 25,
      status: 'Low Stock',
    },
    {
      name: 'ITEM-0003',
      doctype: 'Item',
      owner: 'Carlos Gomez',
      creation: '2026-02-15 14:00:00',
      modified: '2026-03-23 18:00:00',
      docstatus: 0,
      item_code: 'TITANIUM-PLATE-3MM',
      item_name: 'Grade 5 Titanium Plate 3mm Sheet (1m x 2m)',
      item_group: 'Raw Materials',
      stock_uom: 'Kg',
      standard_rate: 195,
      valuation_rate: 130,
      total_qty: 820,
      reorder_level: 150,
      status: 'In Stock',
    },
    {
      name: 'ITEM-0004',
      doctype: 'Item',
      owner: 'Carlos Gomez',
      creation: '2026-02-20 09:20:00',
      modified: '2026-03-24 12:00:00',
      docstatus: 0,
      item_code: 'CORE-MCU-RISCV',
      item_name: 'RISC-V Dual Core Embedded Processing Board',
      item_group: 'Assemblies',
      stock_uom: 'Nos',
      standard_rate: 450,
      valuation_rate: 280,
      total_qty: 0,
      reorder_level: 15,
      status: 'Out of Stock',
    },
  ],
  'Sales Order': [
    {
      name: 'SO-2026-001',
      doctype: 'Sales Order',
      owner: 'Alex Vance',
      creation: '2026-03-18 10:30:00',
      modified: '2026-03-18 14:00:00',
      docstatus: 1, // Submitted
      customer: 'Helios Semiconductor Corp',
      transaction_date: '2026-03-18',
      delivery_date: '2026-04-05',
      currency: 'USD',
      items_summary: '50x Precision Fiber Optical Transceiver 400G',
      net_total: 34000,
      tax_amount: 2720,
      grand_total: 36720,
      workflow_state: 'Submitted',
    },
    {
      name: 'SO-2026-002',
      doctype: 'Sales Order',
      owner: 'Alex Vance',
      creation: '2026-03-21 16:00:00',
      modified: '2026-03-22 11:30:00',
      docstatus: 1, // Submitted
      customer: 'Kyoto Robotics Automation',
      transaction_date: '2026-03-21',
      delivery_date: '2026-04-12',
      currency: 'USD',
      items_summary: '20x Micro-Servo Actuator 24V, 100kg Titanium Plate',
      net_total: 26300,
      tax_amount: 2104,
      grand_total: 28404,
      workflow_state: 'Submitted',
    },
    {
      name: 'SO-2026-003',
      doctype: 'Sales Order',
      owner: 'Alex Vance',
      creation: '2026-03-24 09:15:00',
      modified: '2026-03-24 09:15:00',
      docstatus: 0, // Draft
      customer: 'AeroDynamic Propulsion Ltd',
      transaction_date: '2026-03-24',
      delivery_date: '2026-04-20',
      currency: 'USD',
      items_summary: '15x Precision Fiber Optical Transceiver 400G',
      net_total: 10200,
      tax_amount: 816,
      grand_total: 11016,
      workflow_state: 'Draft',
    },
  ],
  'Sales Invoice': [
    {
      name: 'SINV-2026-001',
      doctype: 'Sales Invoice',
      owner: 'Sarah Lin',
      creation: '2026-03-19 11:00:00',
      modified: '2026-03-19 11:00:00',
      docstatus: 1,
      customer: 'Helios Semiconductor Corp',
      posting_date: '2026-03-19',
      due_date: '2026-04-18',
      sales_order: 'SO-2026-001',
      outstanding_amount: 36720,
      grand_total: 36720,
      payment_status: 'Unpaid',
    },
    {
      name: 'SINV-2026-002',
      doctype: 'Sales Invoice',
      owner: 'Sarah Lin',
      creation: '2026-03-22 15:30:00',
      modified: '2026-03-23 10:00:00',
      docstatus: 1,
      customer: 'Kyoto Robotics Automation',
      posting_date: '2026-03-22',
      due_date: '2026-04-21',
      sales_order: 'SO-2026-002',
      outstanding_amount: 0,
      grand_total: 28404,
      payment_status: 'Paid',
    },
  ],
  'Stock Entry': [
    {
      name: 'STE-2026-001',
      doctype: 'Stock Entry',
      owner: 'Carlos Gomez',
      creation: '2026-03-15 08:30:00',
      modified: '2026-03-15 08:30:00',
      docstatus: 1,
      purpose: 'Material Receipt',
      posting_date: '2026-03-15',
      item_code: 'NX-OPTIC-400',
      qty: 60,
      from_warehouse: 'Stores',
      to_warehouse: 'Finished Goods',
      total_value: 25200,
    },
    {
      name: 'STE-2026-002',
      doctype: 'Stock Entry',
      owner: 'Carlos Gomez',
      creation: '2026-03-20 14:00:00',
      modified: '2026-03-20 14:00:00',
      docstatus: 1,
      purpose: 'Material Transfer',
      posting_date: '2026-03-20',
      item_code: 'TITANIUM-PLATE-3MM',
      qty: 100,
      from_warehouse: 'Stores',
      to_warehouse: 'WIP',
      total_value: 13000,
    },
  ],
  Employee: [
    {
      name: 'EMP-001',
      doctype: 'Employee',
      owner: 'Priya Patel',
      creation: '2024-04-01 09:00:00',
      modified: '2026-03-24 10:15:00',
      docstatus: 0,
      employee_name: 'Dr. Marcus Sterling',
      first_name: 'Marcus',
      last_name: 'Sterling',
      company_email: 'marcus.sterling@aether-erp.internal',
      personal_email: 'm.sterling.phd@gmail.com',
      cell_number: '+1 (415) 555-0182',
      department: 'Engineering',
      designation: 'Principal Systems Architect',
      grade: 'L5 - Director / Executive',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: '2024-04-01',
      confirmation_date: '2024-07-01',
      work_location: 'Headquarters',
      reports_to: 'Board of Directors',
      monthly_salary: 14500,
      allowance_housing: 2200,
      allowance_transport_meal: 900,
      deduction_tax_health: 2650,
      bank_name: 'JPMorgan Chase',
      bank_account_no: '8820-4911-3021',
      bank_account_name: 'Dr. Marcus Sterling',
      leave_balance: 14,
      leaves_taken: 4,
      attendance_rate: 99.2,
      gender: 'Male',
      date_of_birth: '1984-06-18',
      marital_status: 'Married',
      blood_group: 'O+',
      identification_id: 'ID-US-9830211',
      emergency_contact_name: 'Eleanor Sterling',
      emergency_contact_phone: '+1 (415) 555-0199',
      current_address: '450 Mission St, Apt 28B, San Francisco, CA 94105',
      skills: 'Distributed Systems, High-Concurrency DBAL, Rust, Python, Event Driven Architecture, Cloud Infrastructure',
      education: 'Ph.D. in Computer Systems, Stanford University (2012)',
      performance_rating: 4.95,
      bio_notes: 'Founding architect of the Aether ERP core engine. Leads core framework and database abstraction layer.',
    },
    {
      name: 'EMP-002',
      doctype: 'Employee',
      owner: 'Priya Patel',
      creation: '2024-08-15 09:00:00',
      modified: '2026-03-20 14:30:00',
      docstatus: 0,
      employee_name: 'Elena Rostova',
      first_name: 'Elena',
      last_name: 'Rostova',
      company_email: 'elena.rostova@aether-erp.internal',
      personal_email: 'e.rostova.zurich@outlook.com',
      cell_number: '+41 44 215 8901',
      department: 'Operations & Logistics',
      designation: 'Supply Chain Operations Lead',
      grade: 'L4 - Manager / Staff',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: '2024-08-15',
      confirmation_date: '2024-11-15',
      work_location: 'Headquarters',
      reports_to: 'Dr. Marcus Sterling',
      monthly_salary: 9800,
      allowance_housing: 1500,
      allowance_transport_meal: 750,
      deduction_tax_health: 1600,
      bank_name: 'Citibank',
      bank_account_no: '4390-1120-7764',
      bank_account_name: 'Elena Rostova',
      leave_balance: 11,
      leaves_taken: 5,
      attendance_rate: 98.4,
      gender: 'Female',
      date_of_birth: '1989-11-23',
      marital_status: 'Single',
      blood_group: 'A+',
      identification_id: 'ID-CH-7740192',
      emergency_contact_name: 'Dmitri Rostov',
      emergency_contact_phone: '+41 44 215 8920',
      current_address: 'Bärengasse 14, 8001 Zürich, Switzerland',
      skills: 'Global Logistics, Multi-Warehouse Routing, Inventory Valuation, Lean Six Sigma, ERP Stock Movements',
      education: 'M.Sc. Industrial Engineering & Supply Chain, ETH Zürich (2015)',
      performance_rating: 4.8,
      bio_notes: 'Directs physical stock operations, bonded warehouse compliance, and real-time inventory ledger integrity.',
    },
    {
      name: 'EMP-003',
      doctype: 'Employee',
      owner: 'Priya Patel',
      creation: '2025-01-08 09:00:00',
      modified: '2026-03-22 16:10:00',
      docstatus: 0,
      employee_name: 'Takeshi Yamada',
      first_name: 'Takeshi',
      last_name: 'Yamada',
      company_email: 'takeshi.yamada@aether-erp.internal',
      personal_email: 't.yamada.tokyo@gmail.com',
      cell_number: '+81 3 5555 0143',
      department: 'Sales & Marketing',
      designation: 'Enterprise Account Executive',
      grade: 'L3 - Senior Engineer / Lead',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: '2025-01-08',
      confirmation_date: '2025-04-08',
      work_location: 'Singapore Logistics Hub',
      reports_to: 'Sarah Lin',
      monthly_salary: 8800,
      allowance_housing: 1400,
      allowance_transport_meal: 650,
      deduction_tax_health: 1350,
      bank_name: 'HSBC',
      bank_account_no: '7102-3341-9081',
      bank_account_name: 'Takeshi Yamada',
      leave_balance: 9,
      leaves_taken: 3,
      attendance_rate: 98.1,
      gender: 'Male',
      date_of_birth: '1992-03-14',
      marital_status: 'Married',
      blood_group: 'B+',
      identification_id: 'ID-JP-4402198',
      emergency_contact_name: 'Yuka Yamada',
      emergency_contact_phone: '+81 3 5555 0144',
      current_address: 'Roppongi Hills Residences 4-10-1, Minato-ku, Tokyo',
      skills: 'Strategic Account Management, B2B SaaS Contracts, CRM Pipelines, Deal Closing, Multi-Territory Sales',
      education: 'B.A. International Business Management, Waseda University (2016)',
      performance_rating: 4.75,
      bio_notes: 'Drives strategic high-value client acquisitions across APAC and North America semiconductors.',
    },
    {
      name: 'EMP-004',
      doctype: 'Employee',
      owner: 'Priya Patel',
      creation: '2024-11-01 09:00:00',
      modified: '2026-03-24 11:45:00',
      docstatus: 0,
      employee_name: 'Claire Dupont',
      first_name: 'Claire',
      last_name: 'Dupont',
      company_email: 'claire.dupont@aether-erp.internal',
      personal_email: 'claire.dupont.paris@yahoo.fr',
      cell_number: '+33 1 42 68 55 00',
      department: 'Finance & Accounting',
      designation: 'Senior Financial Controller',
      grade: 'L4 - Manager / Staff',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: '2024-11-01',
      confirmation_date: '2025-02-01',
      work_location: 'London Regional Office',
      reports_to: 'Board of Directors',
      monthly_salary: 11000,
      allowance_housing: 1800,
      allowance_transport_meal: 800,
      deduction_tax_health: 2100,
      bank_name: 'Barclays',
      bank_account_no: '2049-8812-4430',
      bank_account_name: 'Claire Dupont',
      leave_balance: 15,
      leaves_taken: 2,
      attendance_rate: 99.8,
      gender: 'Female',
      date_of_birth: '1987-08-30',
      marital_status: 'Married',
      blood_group: 'AB+',
      identification_id: 'ID-FR-8891023',
      emergency_contact_name: 'Henri Dupont',
      emergency_contact_phone: '+33 1 42 68 55 01',
      current_address: '18 Rue de la Paix, 75002 Paris, France',
      skills: 'Double-Entry Ledger Auditing, IFRS & US GAAP Compliance, Cash Flow Projections, Statutory Tax Filing',
      education: 'Master in Corporate Finance, HEC Paris (2011), Certified Public Accountant (CPA)',
      performance_rating: 5.0,
      bio_notes: 'Oversees company general ledger, fiscal balance reconciliation, and corporate accounting controls.',
    },
    {
      name: 'EMP-005',
      doctype: 'Employee',
      owner: 'Priya Patel',
      creation: '2023-10-15 09:00:00',
      modified: '2026-03-21 14:00:00',
      docstatus: 0,
      employee_name: 'Sarah Lin',
      first_name: 'Sarah',
      last_name: 'Lin',
      company_email: 'sarah.lin@aether-erp.internal',
      personal_email: 'sarah.lin.exec@gmail.com',
      cell_number: '+1 (415) 555-0138',
      department: 'Sales & Marketing',
      designation: 'Chief Commercial Officer & VP Sales',
      grade: 'L5 - Director / Executive',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: '2023-10-15',
      confirmation_date: '2024-01-15',
      work_location: 'Headquarters',
      reports_to: 'Board of Directors',
      monthly_salary: 15800,
      allowance_housing: 2500,
      allowance_transport_meal: 1000,
      deduction_tax_health: 2900,
      bank_name: 'JPMorgan Chase',
      bank_account_no: '9910-4421-7782',
      bank_account_name: 'Sarah Lin',
      leave_balance: 10,
      leaves_taken: 6,
      attendance_rate: 98.9,
      gender: 'Female',
      date_of_birth: '1985-04-12',
      marital_status: 'Married',
      blood_group: 'O+',
      identification_id: 'ID-US-5501928',
      emergency_contact_name: 'David Zhao',
      emergency_contact_phone: '+1 (415) 555-0139',
      current_address: '1200 California St, San Francisco, CA 94109',
      skills: 'Revenue Operations, Global GTM Strategy, Contract Legal Structuring, Customer Success',
      education: 'MBA in Global Business, INSEAD (2014)',
      performance_rating: 4.9,
      bio_notes: 'Leads global revenue teams, distributor relationships, and direct commercial deals.',
    },
    {
      name: 'EMP-006',
      doctype: 'Employee',
      owner: 'Administrator',
      creation: '2024-02-01 09:00:00',
      modified: '2026-03-24 15:30:00',
      docstatus: 0,
      employee_name: 'Priya Patel',
      first_name: 'Priya',
      last_name: 'Patel',
      company_email: 'priya.patel@aether-erp.internal',
      personal_email: 'priya.patel.hr@gmail.com',
      cell_number: '+1 (415) 555-0177',
      department: 'People & HR',
      designation: 'Head of People & Talent Operations',
      grade: 'L4 - Manager / Staff',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: '2024-02-01',
      confirmation_date: '2024-05-01',
      work_location: 'Headquarters',
      reports_to: 'Board of Directors',
      monthly_salary: 10500,
      allowance_housing: 1600,
      allowance_transport_meal: 700,
      deduction_tax_health: 1950,
      bank_name: 'Citibank',
      bank_account_no: '5540-1928-3310',
      bank_account_name: 'Priya Patel',
      leave_balance: 13,
      leaves_taken: 3,
      attendance_rate: 99.4,
      gender: 'Female',
      date_of_birth: '1988-09-05',
      marital_status: 'Single',
      blood_group: 'B-',
      identification_id: 'ID-US-7782910',
      emergency_contact_name: 'Sunita Patel',
      emergency_contact_phone: '+1 (415) 555-0178',
      current_address: '780 Market St, San Francisco, CA 94102',
      skills: 'HR Policies, Compensation Benchmarking, Talent Development, Indonesian & US Labor Law, Culture',
      education: 'M.A. Organizational Psychology, Columbia University (2013), SHRM-SCP',
      performance_rating: 4.85,
      bio_notes: 'Leads people strategy, talent acquisition, payroll grading systems, and organizational health.',
    },
    {
      name: 'EMP-007',
      doctype: 'Employee',
      owner: 'Priya Patel',
      creation: '2025-02-15 09:00:00',
      modified: '2026-03-23 09:30:00',
      docstatus: 0,
      employee_name: 'Aria Kusuma',
      first_name: 'Aria',
      last_name: 'Kusuma',
      company_email: 'aria.kusuma@aether-erp.internal',
      personal_email: 'ariakusuma.dev@gmail.com',
      cell_number: '+62 812 8899 0011',
      department: 'Engineering',
      designation: 'Staff Fullstack & UI/UX Engineer',
      grade: 'L3 - Senior Engineer / Lead',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: '2025-02-15',
      confirmation_date: '2025-05-15',
      work_location: 'Remote / WFH',
      reports_to: 'Dr. Marcus Sterling',
      monthly_salary: 9200,
      allowance_housing: 1400,
      allowance_transport_meal: 700,
      deduction_tax_health: 1550,
      bank_name: 'Bank Central Asia',
      bank_account_no: '8091-2245-19',
      bank_account_name: 'Aria Kusuma',
      leave_balance: 12,
      leaves_taken: 2,
      attendance_rate: 99.1,
      gender: 'Male',
      date_of_birth: '1993-07-28',
      marital_status: 'Married',
      blood_group: 'O+',
      identification_id: 'NIK-3171022807930005',
      emergency_contact_name: 'Nadia Kusuma',
      emergency_contact_phone: '+62 813 9900 1122',
      current_address: 'Jl. Senopati No. 42, Kebayoran Baru, Jakarta Selatan 12190',
      skills: 'React, TypeScript, Tailwind CSS, Python/Frappe Framework, REST APIs, Design Systems, State Management',
      education: 'S.T. Teknik Informatika, Institut Teknologi Bandung (ITB) (2015)',
      performance_rating: 4.8,
      bio_notes: 'Crafts the high-fidelity user interface, modular ERP desk components, and real-time dashboard visualizations.',
    },
    {
      name: 'EMP-008',
      doctype: 'Employee',
      owner: 'Priya Patel',
      creation: '2025-05-10 09:00:00',
      modified: '2026-03-24 16:00:00',
      docstatus: 0,
      employee_name: 'Carlos Gomez',
      first_name: 'Carlos',
      last_name: 'Gomez',
      company_email: 'carlos.gomez@aether-erp.internal',
      personal_email: 'carlos.gomez.ops@gmail.com',
      cell_number: '+1 (415) 555-0155',
      department: 'Operations & Logistics',
      designation: 'Warehouse & Stock Specialist',
      grade: 'L2 - Specialist',
      employment_type: 'Full-time',
      status: 'Active',
      date_of_joining: '2025-05-10',
      confirmation_date: '2025-08-10',
      work_location: 'Headquarters',
      reports_to: 'Elena Rostova',
      monthly_salary: 6200,
      allowance_housing: 900,
      allowance_transport_meal: 500,
      deduction_tax_health: 850,
      bank_name: 'JPMorgan Chase',
      bank_account_no: '3310-9921-5502',
      bank_account_name: 'Carlos Gomez',
      leave_balance: 11,
      leaves_taken: 4,
      attendance_rate: 98.7,
      gender: 'Male',
      date_of_birth: '1995-10-04',
      marital_status: 'Single',
      blood_group: 'O-',
      identification_id: 'ID-US-6619024',
      emergency_contact_name: 'Maria Gomez',
      emergency_contact_phone: '+1 (415) 555-0156',
      current_address: '320 10th St, Oakland, CA 94607',
      skills: 'Warehouse Management, Barcode Scanners, Material Issues & Receipts, Stock Replenishment, Safety Auditing',
      education: 'B.S. Supply Chain & Logistics, Texas A&M University (2018)',
      performance_rating: 4.65,
      bio_notes: 'Responsible for daily dock check-ins, stock transfers between stores and WIP, and inventory audits.',
    },
  ],
  'Journal Entry': [
    {
      name: 'JV-2026-001',
      doctype: 'Journal Entry',
      owner: 'Sarah Lin',
      creation: '2026-03-01 10:00:00',
      modified: '2026-03-01 10:00:00',
      docstatus: 1,
      posting_date: '2026-03-01',
      voucher_type: 'Opening Entry',
      account_debit: 'Bank Account',
      account_credit: 'Retained Earnings',
      total_debit: 500000,
      total_credit: 500000,
      user_remark: 'Opening cash equity balance for fiscal Q1 2026',
    },
    {
      name: 'JV-2026-002',
      doctype: 'Journal Entry',
      owner: 'Sarah Lin',
      creation: '2026-03-23 16:00:00',
      modified: '2026-03-23 16:00:00',
      docstatus: 1,
      posting_date: '2026-03-23',
      voucher_type: 'Receipt Entry',
      account_debit: 'Bank Account',
      account_credit: 'Accounts Receivable',
      total_debit: 28404,
      total_credit: 28404,
      user_remark: 'Payment receipt received from Kyoto Robotics Automation for SINV-2026-002',
    },
  ],
  Project: [
    {
      name: 'PROJ-2026-001',
      doctype: 'Project',
      owner: 'Administrator',
      creation: '2026-01-15 09:00:00',
      modified: '2026-03-24 11:30:00',
      docstatus: 0,
      project_name: 'Next-Gen Enterprise DBAL Engine',
      status: 'In Progress',
      priority: 'Urgent',
      project_type: 'R&D',
      customer: 'Helios Semiconductor Corp',
      project_manager: 'Dr. Marcus Sterling',
      expected_start_date: '2026-01-15',
      expected_end_date: '2026-06-30',
      estimated_cost: 145000,
      actual_cost: 74200,
      percent_complete: 68,
      total_billed_hours: 480,
      notes: 'High-concurrency database abstraction layer with real-time transactional event streaming and Python-like document controllers.',
    },
    {
      name: 'PROJ-2026-002',
      doctype: 'Project',
      owner: 'Administrator',
      creation: '2026-02-01 08:30:00',
      modified: '2026-03-24 14:15:00',
      docstatus: 0,
      project_name: 'Kyoto Automated Warehouse Integration',
      status: 'In Progress',
      priority: 'High',
      project_type: 'Client Work',
      customer: 'Kyoto Robotics Automation',
      project_manager: 'Elena Rostova',
      expected_start_date: '2026-02-01',
      expected_end_date: '2026-05-20',
      estimated_cost: 92000,
      actual_cost: 58600,
      percent_complete: 82,
      total_billed_hours: 360,
      notes: 'Automated RFID conveyor integration and real-time inventory ledger sync between physical bonded warehouse and cloud ERP.',
    },
    {
      name: 'PROJ-2026-003',
      doctype: 'Project',
      owner: 'Administrator',
      creation: '2026-03-01 10:00:00',
      modified: '2026-03-22 16:45:00',
      docstatus: 0,
      project_name: 'Global Supply Chain Multi-Territory EDI',
      status: 'Open',
      priority: 'Medium',
      project_type: 'Client Work',
      customer: 'Helios Semiconductor Corp',
      project_manager: 'Sarah Lin',
      expected_start_date: '2026-04-01',
      expected_end_date: '2026-09-15',
      estimated_cost: 180000,
      actual_cost: 21500,
      percent_complete: 25,
      total_billed_hours: 175,
      notes: 'Automating high-volume Purchase Order and Sales Invoice transmission between North America and APAC logistics hubs.',
    },
    {
      name: 'PROJ-2026-004',
      doctype: 'Project',
      owner: 'Administrator',
      creation: '2026-02-15 09:00:00',
      modified: '2026-03-24 16:30:00',
      docstatus: 0,
      project_name: 'ISO-27001 & SOC-2 Type II Compliance',
      status: 'In Progress',
      priority: 'High',
      project_type: 'Internal',
      customer: '',
      project_manager: 'Priya Patel',
      expected_start_date: '2026-02-15',
      expected_end_date: '2026-04-30',
      estimated_cost: 50000,
      actual_cost: 38400,
      percent_complete: 92,
      total_billed_hours: 240,
      notes: 'Information security audit verification, role-based access control audit logging, and automated vulnerability scanning pipeline.',
    },
  ],
  Task: [
    {
      name: 'TASK-2026-001',
      doctype: 'Task',
      owner: 'Dr. Marcus Sterling',
      creation: '2026-01-20 10:00:00',
      modified: '2026-03-24 09:30:00',
      docstatus: 0,
      title: 'Implement Multi-Tenant Connection Pooling in DBAL',
      project: 'PROJ-2026-001',
      status: 'In Progress',
      priority: 'Urgent',
      assigned_to: 'Dr. Marcus Sterling',
      expected_hours: 45,
      actual_hours: 38,
      start_date: '2026-03-10',
      due_date: '2026-03-28',
      progress: 85,
      description: 'Design zero-allocation lock-free connection pooler for heavy concurrent REST API read/write operations.',
    },
    {
      name: 'TASK-2026-002',
      doctype: 'Task',
      owner: 'Dr. Marcus Sterling',
      creation: '2026-01-25 11:00:00',
      modified: '2026-03-23 17:00:00',
      docstatus: 0,
      title: 'Interactive Project Detail, Task Kanban & Timesheet UI',
      project: 'PROJ-2026-001',
      status: 'Completed',
      priority: 'High',
      assigned_to: 'Aria Kusuma',
      expected_hours: 35,
      actual_hours: 32,
      start_date: '2026-03-15',
      due_date: '2026-03-25',
      progress: 100,
      description: 'Implement enterprise-grade responsive Project Hub, drag-and-drop Task Kanban board, and billable Timesheet tracker.',
    },
    {
      name: 'TASK-2026-003',
      doctype: 'Task',
      owner: 'Elena Rostova',
      creation: '2026-02-05 09:30:00',
      modified: '2026-03-24 13:00:00',
      docstatus: 0,
      title: 'Warehouse RFID Sensor Gateway Parser',
      project: 'PROJ-2026-002',
      status: 'In Progress',
      priority: 'Urgent',
      assigned_to: 'Elena Rostova',
      expected_hours: 30,
      actual_hours: 22,
      start_date: '2026-03-12',
      due_date: '2026-03-29',
      progress: 75,
      description: 'Decode byte-stream RFID sensor packets into automated Stock Entry transactions with bin lot numbers.',
    },
    {
      name: 'TASK-2026-004',
      doctype: 'Task',
      owner: 'Elena Rostova',
      creation: '2026-02-10 14:00:00',
      modified: '2026-03-24 15:45:00',
      docstatus: 0,
      title: 'Pick-and-Pack Route Optimization Algorithm',
      project: 'PROJ-2026-002',
      status: 'Review',
      priority: 'High',
      assigned_to: 'Carlos Gomez',
      expected_hours: 28,
      actual_hours: 27,
      start_date: '2026-03-14',
      due_date: '2026-03-27',
      progress: 95,
      description: 'Minimize order picker transit distances across 5 warehouse aisles for automated conveyor discharge.',
    },
    {
      name: 'TASK-2026-005',
      doctype: 'Task',
      owner: 'Sarah Lin',
      creation: '2026-03-05 10:00:00',
      modified: '2026-03-22 11:20:00',
      docstatus: 0,
      title: 'Client EDI AS2 Gateway Protocol Configuration',
      project: 'PROJ-2026-003',
      status: 'Todo',
      priority: 'Medium',
      assigned_to: 'Takeshi Yamada',
      expected_hours: 24,
      actual_hours: 6,
      start_date: '2026-03-24',
      due_date: '2026-04-10',
      progress: 25,
      description: 'Configure encrypted secure AS2 endpoints with Helios Semiconductor IT team for 850/810 document payloads.',
    },
    {
      name: 'TASK-2026-006',
      doctype: 'Task',
      owner: 'Sarah Lin',
      creation: '2026-03-08 14:30:00',
      modified: '2026-03-20 16:00:00',
      docstatus: 0,
      title: 'Multi-Currency Fiscal Compliance Verification',
      project: 'PROJ-2026-003',
      status: 'Backlog',
      priority: 'Low',
      assigned_to: 'Claire Dupont',
      expected_hours: 18,
      actual_hours: 0,
      start_date: '2026-04-05',
      due_date: '2026-04-20',
      progress: 0,
      description: 'Validate automated FX hedging calculations for JPY, EUR, and USD simultaneous invoicing.',
    },
    {
      name: 'TASK-2026-007',
      doctype: 'Task',
      owner: 'Priya Patel',
      creation: '2026-02-18 09:00:00',
      modified: '2026-03-24 16:00:00',
      docstatus: 0,
      title: 'Audit Trail & Immutable Ledger Snapshot Verification',
      project: 'PROJ-2026-004',
      status: 'Completed',
      priority: 'Urgent',
      assigned_to: 'Priya Patel',
      expected_hours: 40,
      actual_hours: 38,
      start_date: '2026-03-01',
      due_date: '2026-03-22',
      progress: 100,
      description: 'Gather SOC-2 evidence artifacts demonstrating strict tamper-evident auditing on all financial journal modifications.',
    },
    {
      name: 'TASK-2026-008',
      doctype: 'Task',
      owner: 'Priya Patel',
      creation: '2026-02-22 11:15:00',
      modified: '2026-03-24 14:40:00',
      docstatus: 0,
      title: 'Role-Based Access Control (RBAC) Boundary Penetration Test',
      project: 'PROJ-2026-004',
      status: 'Review',
      priority: 'High',
      assigned_to: 'Dr. Marcus Sterling',
      expected_hours: 20,
      actual_hours: 19,
      start_date: '2026-03-18',
      due_date: '2026-03-26',
      progress: 95,
      description: 'Verify strict isolation between Stock Users, HR Managers, and Accounting Managers across all REST API endpoints.',
    },
  ],
  Timesheet: [
    {
      name: 'TS-2026-001',
      doctype: 'Timesheet',
      owner: 'Dr. Marcus Sterling',
      creation: '2026-03-21 17:00:00',
      modified: '2026-03-21 17:00:00',
      docstatus: 1,
      employee: 'Dr. Marcus Sterling',
      project: 'PROJ-2026-001',
      task: 'Implement Multi-Tenant Connection Pooling in DBAL',
      start_date: '2026-03-21',
      hours: 7.5,
      is_billable: true,
      billing_rate: 150,
      total_billed_amount: 1125,
      activity_type: 'Architecture Design',
      notes: 'Refactored async database connection acquire/release cycles to eliminate deadlock conditions under high load.',
    },
    {
      name: 'TS-2026-002',
      doctype: 'Timesheet',
      owner: 'Aria Kusuma',
      creation: '2026-03-22 18:00:00',
      modified: '2026-03-22 18:00:00',
      docstatus: 1,
      employee: 'Aria Kusuma',
      project: 'PROJ-2026-001',
      task: 'Interactive Project Detail, Task Kanban & Timesheet UI',
      start_date: '2026-03-22',
      hours: 8.0,
      is_billable: true,
      billing_rate: 95,
      total_billed_amount: 760,
      activity_type: 'Software Development',
      notes: 'Constructed responsive task kanban board with stage drag-and-drop and real-time state mutation in frappeDB.',
    },
    {
      name: 'TS-2026-003',
      doctype: 'Timesheet',
      owner: 'Elena Rostova',
      creation: '2026-03-23 16:30:00',
      modified: '2026-03-23 16:30:00',
      docstatus: 1,
      employee: 'Elena Rostova',
      project: 'PROJ-2026-002',
      task: 'Warehouse RFID Sensor Gateway Parser',
      start_date: '2026-03-23',
      hours: 6.5,
      is_billable: true,
      billing_rate: 110,
      total_billed_amount: 715,
      activity_type: 'Software Development',
      notes: 'Validated barcode scanner telemetry packets and integrated direct payload dispatch into Stock Entry table.',
    },
    {
      name: 'TS-2026-004',
      doctype: 'Timesheet',
      owner: 'Carlos Gomez',
      creation: '2026-03-24 15:00:00',
      modified: '2026-03-24 15:00:00',
      docstatus: 1,
      employee: 'Carlos Gomez',
      project: 'PROJ-2026-002',
      task: 'Pick-and-Pack Route Optimization Algorithm',
      start_date: '2026-03-24',
      hours: 7.0,
      is_billable: true,
      billing_rate: 75,
      total_billed_amount: 525,
      activity_type: 'Quality Assurance',
      notes: 'Benchmarked physical warehouse picking efficiency with sample batches of 500 order lines.',
    },
    {
      name: 'TS-2026-005',
      doctype: 'Timesheet',
      owner: 'Takeshi Yamada',
      creation: '2026-03-24 16:00:00',
      modified: '2026-03-24 16:00:00',
      docstatus: 1,
      employee: 'Takeshi Yamada',
      project: 'PROJ-2026-003',
      task: 'Client EDI AS2 Gateway Protocol Configuration',
      start_date: '2026-03-24',
      hours: 4.5,
      is_billable: true,
      billing_rate: 100,
      total_billed_amount: 450,
      activity_type: 'Client Consultation',
      notes: 'Held technical coordination call with Helios IT leads on certificate renewal and testing schedule.',
    },
    {
      name: 'TS-2026-006',
      doctype: 'Timesheet',
      owner: 'Priya Patel',
      creation: '2026-03-24 17:30:00',
      modified: '2026-03-24 17:30:00',
      docstatus: 1,
      employee: 'Priya Patel',
      project: 'PROJ-2026-004',
      task: 'Role-Based Access Control (RBAC) Boundary Penetration Test',
      start_date: '2026-03-24',
      hours: 5.0,
      is_billable: false,
      billing_rate: 120,
      total_billed_amount: 0,
      activity_type: 'Project Management',
      notes: 'Conducted compliance checkpoint for internal ISO-27001 audit readiness documentation.',
    },
  ],
};

const STORAGE_KEY_DOCTYPES = 'aether_erp_doctypes_v6';
const STORAGE_KEY_DOCS = 'aether_erp_docs_v6';

class DatabaseAbstractionLayer {
  private doctypes: Map<string, DocTypeMeta> = new Map();
  private documents: Map<string, BaseDoc[]> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedDoctypes = localStorage.getItem(STORAGE_KEY_DOCTYPES);
      if (storedDoctypes) {
        const parsed = JSON.parse(storedDoctypes);
        parsed.forEach((dt: DocTypeMeta) => this.doctypes.set(dt.name, dt));
      } else {
        INITIAL_DOCTYPES.forEach((dt) => this.doctypes.set(dt.name, dt));
        this.saveDoctypesToStorage();
      }

      // Ensure standard schemas (Employee, Project, Task, Timesheet) always exist and have the latest definitions
      INITIAL_DOCTYPES.forEach((initialDt) => {
        const existing = this.doctypes.get(initialDt.name);
        if (!existing || (initialDt.fields.length > existing.fields.length)) {
          this.doctypes.set(initialDt.name, initialDt);
        }
      });

      const storedDocs = localStorage.getItem(STORAGE_KEY_DOCS);
      if (storedDocs) {
        const parsed = JSON.parse(storedDocs);
        Object.keys(parsed).forEach((dt) => {
          this.documents.set(dt, parsed[dt]);
        });
      } else {
        Object.keys(INITIAL_DOCUMENTS).forEach((dt) => {
          this.documents.set(dt, [...INITIAL_DOCUMENTS[dt]]);
        });
        this.saveDocsToStorage();
      }

      // Ensure Project, Task, Timesheet records exist in documents map
      ['Project', 'Task', 'Timesheet'].forEach((dt) => {
        const existingList = this.documents.get(dt);
        if (!existingList || existingList.length === 0) {
          if (INITIAL_DOCUMENTS[dt]) {
            this.documents.set(dt, [...INITIAL_DOCUMENTS[dt]]);
          } else {
            this.documents.set(dt, []);
          }
        }
      });
      this.saveDocsToStorage();

      // Ensure Employee records contain full detailed profiles
      const empDocs = this.documents.get('Employee');
      if (!empDocs || empDocs.length < 5 || !empDocs[0]?.company_email) {
        this.documents.set('Employee', [...INITIAL_DOCUMENTS['Employee']]);
      }

      // Ensure Adi Toto Haryono is in Employee list
      const currentEmps = this.documents.get('Employee') || [];
      if (!currentEmps.some((e: any) => e.employee_name && e.employee_name.includes('Adi Toto Haryono'))) {
        currentEmps.push({
          name: 'EMP-009',
          doctype: 'Employee',
          owner: 'Priya Patel',
          creation: '2025-06-01 09:00:00',
          modified: '2026-03-24 16:00:00',
          docstatus: 0,
          employee_name: 'Adi Toto Haryono (105115)',
          first_name: 'Adi Toto',
          last_name: 'Haryono',
          company_email: 'adi.haryono@aether-erp.internal',
          personal_email: 'adi.haryono105115@gmail.com',
          cell_number: '+62 811 2345 6789',
          department: 'Operations & Engineering',
          designation: 'Operations Specialist',
          grade: 'L3 - Senior Specialist',
          employment_type: 'Full-time',
          status: 'Active',
          date_of_joining: '2025-06-01',
          confirmation_date: '2025-09-01',
          work_location: 'Jakarta Hub',
          reports_to: 'Dr. Marcus Sterling',
          monthly_salary: 8500,
          allowance_housing: 1200,
          allowance_transport_meal: 600,
          deduction_tax_health: 1200,
          bank_name: 'Bank Mandiri',
          bank_account_no: '142-00-105115-9',
          bank_account_name: 'Adi Toto Haryono',
          leave_balance: 14,
          leaves_taken: 1,
          attendance_rate: 99.5,
          gender: 'Male',
          date_of_birth: '1991-04-12',
          marital_status: 'Married',
          blood_group: 'A+',
          identification_id: '105115',
          emergency_contact_name: 'Siti Rahma',
          emergency_contact_phone: '+62 812 3456 7890',
          current_address: 'Komp. Graha Indah Blok C2/15, Jakarta',
          skills: 'Project Coordination, Operations Management, Timesheet Tracking, Resource Allocation',
          education: 'S.T. Teknik Industri, Universitas Indonesia',
          performance_rating: 4.9,
          bio_notes: 'Operations specialist managing regional task delivery, timesheets, and resource logistics.',
        } as any);
        this.documents.set('Employee', currentEmps);
      }

      // Ensure Administration is in Project list
      const currentProjs = this.documents.get('Project') || [];
      if (!currentProjs.some((p: any) => p.project_name === 'Administration')) {
        currentProjs.unshift({
          name: 'PROJ-ADMIN',
          doctype: 'Project',
          owner: 'Administrator',
          creation: '2026-01-01 08:00:00',
          modified: '2026-03-24 10:00:00',
          docstatus: 0,
          project_name: 'Administration',
          status: 'In Progress',
          priority: 'Low',
          project_type: 'Internal',
          customer: 'Aether Technologies Inc.',
          project_manager: 'Priya Patel',
          expected_start_date: '2026-01-01',
          expected_end_date: '2026-12-31',
          estimated_cost: 50000,
          actual_cost: 16200,
          percent_complete: 50,
          total_billed_hours: 120,
          notes: 'Internal operations, administration, company governance, and departmental overhead.',
        } as any);
        this.documents.set('Project', currentProjs);
      }
      this.saveDocsToStorage();
    } catch (e) {
      console.error('Failed to load DB from localStorage, using fallback', e);
      INITIAL_DOCTYPES.forEach((dt) => this.doctypes.set(dt.name, dt));
      Object.keys(INITIAL_DOCUMENTS).forEach((dt) => {
        this.documents.set(dt, [...INITIAL_DOCUMENTS[dt]]);
      });
    }
  }

  private saveDoctypesToStorage() {
    try {
      const array = Array.from(this.doctypes.values());
      localStorage.setItem(STORAGE_KEY_DOCTYPES, JSON.stringify(array));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }

  private saveDocsToStorage() {
    try {
      const obj: Record<string, BaseDoc[]> = {};
      this.documents.forEach((docs, dt) => {
        obj[dt] = docs;
      });
      localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(obj));
    } catch (e) {
      console.warn('Storage save failed', e);
    }
  }

  private notify() {
    this.saveDocsToStorage();
    this.saveDoctypesToStorage();
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // --- Meta Schema Operations ---
  public get_doctype(name: string): DocTypeMeta | undefined {
    return this.doctypes.get(name);
  }

  public get_all_doctypes(): DocTypeMeta[] {
    return Array.from(this.doctypes.values());
  }

  public save_doctype(meta: DocTypeMeta): DocTypeMeta {
    this.doctypes.set(meta.name, meta);
    if (!this.documents.has(meta.name)) {
      this.documents.set(meta.name, []);
    }
    this.notify();
    return meta;
  }

  // --- Python-like DBAL Methods ---
  public get_doc(doctype: string, name: string): BaseDoc | null {
    const list = this.documents.get(doctype) || [];
    const found = list.find((d) => d.name === name);
    return found ? { ...found } : null;
  }

  public get_list(
    doctype: string,
    options?: {
      filters?: Record<string, any>;
      fields?: string[];
      order_by?: string;
      limit?: number;
    }
  ): BaseDoc[] {
    let list = this.documents.get(doctype) || [];
    let result = [...list];

    // Filter
    if (options?.filters) {
      const filters = options.filters;
      result = result.filter((item) => {
        for (const key of Object.keys(filters)) {
          if (filters[key] === undefined || filters[key] === null || filters[key] === '') continue;
          if (typeof filters[key] === 'string') {
            const val = String(item[key] || '').toLowerCase();
            const query = String(filters[key]).toLowerCase();
            if (!val.includes(query)) return false;
          } else if (item[key] !== filters[key]) {
            return false;
          }
        }
        return true;
      });
    }

    // Sort
    if (options?.order_by) {
      const parts = options.order_by.split(' ');
      const field = parts[0];
      const desc = parts[1]?.toLowerCase() === 'desc';
      result.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        return (valA > valB ? 1 : -1) * (desc ? -1 : 1);
      });
    } else {
      // Default creation desc
      result.sort((a, b) => (b.creation || '').localeCompare(a.creation || ''));
    }

    // Limit
    if (options?.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }

    // Projection
    if (options?.fields && options.fields.length > 0 && !options.fields.includes('*')) {
      const fList = [...options.fields, 'name', 'doctype', 'docstatus', 'creation', 'modified'];
      result = result.map((doc) => {
        const proj: any = {};
        fList.forEach((f) => {
          proj[f] = doc[f];
        });
        return proj;
      });
    }

    return result;
  }

  public insert(docData: Partial<BaseDoc> & { doctype: string }, currentUser = 'Administrator'): BaseDoc {
    const meta = this.doctypes.get(docData.doctype);
    if (!meta) throw new Error(`DocType "${docData.doctype}" does not exist in schema.`);

    const list = this.documents.get(docData.doctype) || [];
    
    // Autoname generation
    const prefix = meta.autoname_prefix || `${docData.doctype.toUpperCase().slice(0, 3)}-`;
    const count = list.length + 1;
    const pad = String(count).padStart(4, '0');
    const name = docData.name && !list.some((d) => d.name === docData.name)
      ? docData.name
      : `${prefix}${pad}`;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newDoc: BaseDoc = {
      ...docData,
      name,
      doctype: docData.doctype,
      owner: currentUser,
      creation: now,
      modified: now,
      docstatus: 0,
    };

    // Auto-calculate for Sales Order or Sales Invoice
    if (newDoc.doctype === 'Sales Order') {
      const net = Number(newDoc.net_total) || 0;
      newDoc.tax_amount = Math.round(net * 0.08 * 100) / 100;
      newDoc.grand_total = Math.round((net + newDoc.tax_amount) * 100) / 100;
      newDoc.workflow_state = 'Draft';
    }

    list.unshift(newDoc);
    this.documents.set(docData.doctype, list);
    this.notify();
    return newDoc;
  }

  public save(docData: BaseDoc, currentUser = 'Administrator'): BaseDoc {
    const list = this.documents.get(docData.doctype) || [];
    const index = list.findIndex((d) => d.name === docData.name);
    if (index === -1) {
      return this.insert(docData, currentUser);
    }

    const existing = list[index];
    if (existing.docstatus === 1) {
      throw new Error(`Cannot edit submitted document "${docData.name}". Cancel it first.`);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated: BaseDoc = {
      ...existing,
      ...docData,
      modified: now,
    };

    if (updated.doctype === 'Sales Order') {
      const net = Number(updated.net_total) || 0;
      updated.tax_amount = Math.round(net * 0.08 * 100) / 100;
      updated.grand_total = Math.round((net + updated.tax_amount) * 100) / 100;
    }

    list[index] = updated;
    this.documents.set(docData.doctype, list);
    this.notify();
    return updated;
  }

  public submit(doctype: string, name: string): BaseDoc {
    const list = this.documents.get(doctype) || [];
    const index = list.findIndex((d) => d.name === name);
    if (index === -1) throw new Error(`Document ${doctype} ${name} not found`);

    const doc = list[index];
    if (doc.docstatus === 1) throw new Error(`Document is already submitted.`);
    if (doc.docstatus === 2) throw new Error(`Cannot submit a cancelled document.`);

    doc.docstatus = 1;
    doc.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (doctype === 'Sales Order') {
      doc.workflow_state = 'Submitted';
    } else if (doctype === 'Stock Entry') {
      // Execute inventory movement effect
      const itemCode = doc.item_code;
      const qty = Number(doc.qty) || 0;
      const item = this.get_doc('Item', itemCode) || this.get_list('Item', { filters: { item_code: itemCode } })[0];
      if (item) {
        if (doc.purpose === 'Material Receipt') {
          item.total_qty = (Number(item.total_qty) || 0) + qty;
        } else if (doc.purpose === 'Material Issue') {
          item.total_qty = Math.max(0, (Number(item.total_qty) || 0) - qty);
        }
        item.status = item.total_qty <= 0 ? 'Out of Stock' : (item.total_qty <= (item.reorder_level || 20) ? 'Low Stock' : 'In Stock');
        this.save(item);
      }
    }

    list[index] = doc;
    this.documents.set(doctype, list);
    this.notify();
    return doc;
  }

  public cancel(doctype: string, name: string): BaseDoc {
    const list = this.documents.get(doctype) || [];
    const index = list.findIndex((d) => d.name === name);
    if (index === -1) throw new Error(`Document ${doctype} ${name} not found`);

    const doc = list[index];
    if (doc.docstatus !== 1) throw new Error(`Can only cancel submitted documents.`);

    doc.docstatus = 2;
    doc.modified = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (doctype === 'Sales Order') {
      doc.workflow_state = 'Cancelled';
    }

    list[index] = doc;
    this.documents.set(doctype, list);
    this.notify();
    return doc;
  }

  public delete_doc(doctype: string, name: string): boolean {
    const list = this.documents.get(doctype) || [];
    const index = list.findIndex((d) => d.name === name);
    if (index === -1) return false;

    const doc = list[index];
    if (doc.docstatus === 1) {
      throw new Error(`Cannot delete submitted document "${name}". Please cancel it first.`);
    }

    list.splice(index, 1);
    this.documents.set(doctype, list);
    this.notify();
    return true;
  }

  public set_value(doctype: string, name: string, fieldname: string, value: any): BaseDoc {
    const doc = this.get_doc(doctype, name);
    if (!doc) throw new Error(`Document ${doctype} ${name} not found`);
    doc[fieldname] = value;
    return this.save(doc);
  }

  public get_value(doctype: string, filters: Record<string, any>, fieldname: string): any {
    const matches = this.get_list(doctype, { filters, limit: 1 });
    if (matches.length > 0) {
      return matches[0][fieldname];
    }
    return null;
  }

  public reset_to_defaults() {
    this.doctypes.clear();
    this.documents.clear();
    INITIAL_DOCTYPES.forEach((dt) => this.doctypes.set(dt.name, dt));
    Object.keys(INITIAL_DOCUMENTS).forEach((dt) => {
      this.documents.set(dt, [...INITIAL_DOCUMENTS[dt]]);
    });
    this.saveDoctypesToStorage();
    this.saveDocsToStorage();
    this.notify();
  }
}

export const frappeDB = new DatabaseAbstractionLayer();
