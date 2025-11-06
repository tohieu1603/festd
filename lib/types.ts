// User & Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'employee' | 'sales';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  avatar?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// Employee Types
export interface Employee {
  id: string;
  name: string;
  role: string;
  skills: string[];
  phone: string;
  email: string;
  address: string;
  base_salary: number;
  notes?: string;
  bank_account: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  emergency_contact: {
    name: string;
    phone: string;
    relationship: string;
  };
  default_rates: {
    main_photo: number;
    assist_photo: number;
    makeup: number;
    retouch: number;
  };
  start_date: string;
  is_active: boolean;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  phone_number?: string;
  role: string;
  salary: number;
  hire_date: string;
}

// Project Types
export type ProjectStatus = 'pending' | 'confirmed' | 'shooting' | 'retouching' | 'delivered' | 'completed' | 'cancelled';

export interface ProjectTeam {
  main_photographer?: {
    employee: string;
    salary: number;
    bonus: number;
    notes?: string;
  } | null;
  assist_photographers: Array<{
    employee: string;
    salary: number;
    bonus: number;
    notes?: string;
  }>;
  makeup_artists: Array<{
    employee: string;
    salary: number;
    bonus: number;
    notes?: string;
  }>;
  retouch_artists: Array<{
    employee: string;
    salary: number;
    bonus: number;
    notes?: string;
  }>;
}

export interface ProjectPayment {
  deposit: number;
  paid: number;
  final: number;
  status: 'unpaid' | 'deposit_paid' | 'partially_paid' | 'fully_paid';
  payment_history: Array<{
    amount: number;
    date: string;
    method: string;
    notes?: string;
  }>;
}

export interface ProjectProgress {
  shooting_done: boolean;
  retouch_done: boolean;
  delivered: boolean;
}

export interface Project {
  id: string;
  project_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  package_type: string;
  package_name: string;
  package_price: number;
  package_discount: number;
  package_final_price: number;
  shoot_date: string;
  shoot_time: string;
  location: string;
  notes?: string;
  status: ProjectStatus;
  payment: ProjectPayment;
  progress: ProjectProgress;
  team: ProjectTeam;
  partners: Record<string, any>;
  additional_packages: string[];
  milestones: any[];
  completed_date?: string;
  delivery_date?: string;
  files: any[];
  update_history: any[];
  created_at: string;
  updated_at: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  client_name: string;
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  budget: number;
  package_id?: number;
  team_member_ids?: number[];
}

// Milestone Types
export interface Milestone {
  id: number;
  project: number;
  title: string;
  description: string;
  due_date: string;
  is_completed: boolean;
  completed_date?: string;
  created_at: string;
  updated_at: string;
}

// Package Types
export type PackageCategory = 'portrait' | 'family' | 'couple' | 'wedding' | 'event' | 'commercial' | 'other';

export interface PackageDetails {
  photo?: number;
  makeup?: number;
  assistant?: number;
  retouch?: number;
  time?: string;
  location?: string;
  retouch_photos?: number;
  extra_services?: string[];
}

export interface Package {
  id: string;
  package_id: string;
  name: string;
  category: PackageCategory;
  price: number;
  details: PackageDetails;
  includes: string[];
  is_active: boolean;
  popularity_score: number;
  description: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PackageFormData {
  name: string;
  category: PackageCategory;
  price: number;
  description: string;
  details?: PackageDetails;
  includes?: string[];
  is_active: boolean;
  notes?: string;
}

// Partner Types
export interface Partner {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone_number?: string;
  address?: string;
  partnership_type: 'supplier' | 'client' | 'contractor' | 'other';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerFormData {
  name: string;
  contact_person: string;
  email: string;
  phone_number?: string;
  address?: string;
  partnership_type: string;
  notes?: string;
}

// Salary Types
export interface SalaryPayment {
  id: number;
  employee: Employee;
  month: string;
  base_salary: number;
  bonus: number;
  deduction: number;
  total_amount: number;
  payment_date?: string;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SalaryFormData {
  employee_id: number;
  month: string;
  bonus?: number;
  deduction?: number;
  notes?: string;
}

// Finance Types
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  project?: Project;
  created_by: User;
  created_at: string;
  updated_at: string;
}

export interface TransactionFormData {
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  transaction_date: string;
  project_id?: number;
}

// Dashboard Statistics
export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_employees: number;
  total_revenue: number;
  total_expenses: number;
  monthly_profit: number;
  pending_salaries: number;
}

// API Response Types
export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Filter & Pagination Types
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface FilterParams {
  search?: string;
  ordering?: string;
  [key: string]: string | number | boolean | undefined;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
