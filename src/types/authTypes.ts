export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type ProjectAccessLevel = 'NO_ACCESS' | 'VIEW' | 'EDIT' | 'FULL';

export interface UserProjectAccess {
  projectId: string;
  projectCode: string;
  projectName?: string;
  accessLevel: ProjectAccessLevel;
}

export type PermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'EXPORT'
  | 'PRINT';

export interface Permission {
  id: string;
  code: string; // e.g. "payments.prv.create"
  name?: string;
  module: string; // e.g. "Payments / PRV"
  category?: string; // category/grouping
  action: PermissionAction;
  description: string;
}

export interface Role {
  id: string;
  code: string; // e.g. "SUPER_ADMIN", "PLANNING_ENGINEER"
  name: string; // e.g. "Planning Engineer"
  description: string;
  permissions: string[]; // List of permission codes
  isSystem?: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  headOfDepartment?: string;
}

export interface Position {
  id: string;
  code: string;
  name: string;
  departmentId?: string;
  departmentName?: string;
  description?: string;
}

export interface AuthUser {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  username: string;
  position: string;
  positionId?: string;
  department: string;
  departmentId?: string;
  role: string; // Role Name e.g. "Planning Engineer"
  roleCode: string; // Role Code e.g. "PLANNING_ENGINEER"
  status: UserStatus;
  profilePhoto?: string;
  assignedProjects: UserProjectAccess[];
  hasAllProjectAccess?: boolean; // For Super Admin / MD
  permissions: string[]; // Effective permissions resolved from Role + overrides
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  employeeId: string;
  userName: string;
  action: string;
  module: string;
  recordType: string;
  recordId?: string;
  projectId?: string;
  projectCode?: string;
  timestamp: string;
  description: string;
  ipAddress?: string;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  
  // Auth actions
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // Permission checks
  hasRole: (roles: string | string[]) => boolean;
  hasPermission: (permissionCode: string) => boolean;
  hasProjectAccess: (projectIdOrCode: string, requiredLevel?: 'VIEW' | 'EDIT' | 'FULL') => boolean;
  getUserProjectLevel: (projectIdOrCode: string) => ProjectAccessLevel;
  getAuthorizedProjects: (allProjects: any[]) => any[];

  // User management & Admin state
  allUsers: AuthUser[];
  allRoles: Role[];
  allPermissions: Permission[];
  allDepartments: Department[];
  allPositions: Position[];
  auditLogs: AuditLog[];
  refreshAdminData: () => Promise<void>;
  
  createUser: (userData: {
    employeeId: string;
    fullName: string;
    email: string;
    username: string;
    password?: string;
    position: string;
    department: string;
    roleCode: string;
    status: UserStatus;
    assignedProjects: UserProjectAccess[];
    hasAllProjectAccess?: boolean;
  }) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  
  updateUser: (userId: string, updates: Partial<AuthUser>) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  toggleUserStatus: (userId: string, newStatus: UserStatus) => Promise<{ success: boolean; error?: string }>;
  updateUserProjects: (userId: string, projects: UserProjectAccess[]) => Promise<{ success: boolean; error?: string }>;
  updateRolePermissions: (roleCode: string, permissions: string[]) => Promise<{ success: boolean; error?: string }>;
  createRole: (role: Omit<Role, 'id'>) => Promise<{ success: boolean; error?: string }>;
  createDepartment: (dept: Omit<Department, 'id'>) => Promise<{ success: boolean; error?: string }>;
  createPosition: (pos: Omit<Position, 'id'>) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string, adminPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteMultipleUsers: (userIds: string[], adminPassword: string) => Promise<{ success: boolean; count?: number; error?: string }>;
  purgeUserDirectory: (adminPassword: string, mode?: 'RESET_DEFAULTS' | 'PURGE_ALL_EXCEPT_CURRENT') => Promise<{ success: boolean; count?: number; error?: string }>;
  logAuditAction: (action: {
    action: string;
    module: string;
    recordType: string;
    recordId?: string;
    projectId?: string;
    description: string;
  }) => Promise<void>;
}
