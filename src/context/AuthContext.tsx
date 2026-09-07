import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthUser,
  AuthContextType,
  Role,
  Permission,
  Department,
  Position,
  AuditLog,
  UserStatus,
  UserProjectAccess,
  ProjectAccessLevel
} from '../types/authTypes';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'ema_erp_auth_token_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Admin and Master state
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Helper for authenticated fetch
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const activeToken = token || localStorage.getItem(TOKEN_KEY);
      const headers = new Headers(options.headers || {});
      if (activeToken) {
        headers.set('Authorization', `Bearer ${activeToken}`);
      }
      headers.set('Content-Type', 'application/json');

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
      }

      return response;
    },
    [token]
  );

  // Refresh admin tables
  const refreshAdminData = useCallback(async () => {
    try {
      const [rolesRes, permsRes, deptsRes, posRes] = await Promise.all([
        authFetch('/api/admin/roles'),
        authFetch('/api/admin/permissions'),
        authFetch('/api/admin/departments'),
        authFetch('/api/admin/positions')
      ]);

      if (rolesRes.ok) {
        const d = await rolesRes.json();
        if (d.roles) setAllRoles(d.roles);
      }
      if (permsRes.ok) {
        const d = await permsRes.json();
        if (d.permissions) setAllPermissions(d.permissions);
      }
      if (deptsRes.ok) {
        const d = await deptsRes.json();
        if (d.departments) setAllDepartments(d.departments);
      }
      if (posRes.ok) {
        const d = await posRes.json();
        if (d.positions) setAllPositions(d.positions);
      }

      // Check users & audit logs if authorized
      const usersRes = await authFetch('/api/admin/users');
      if (usersRes.ok) {
        const d = await usersRes.json();
        if (d.users) setAllUsers(d.users);
      }

      const logsRes = await authFetch('/api/admin/audit-logs');
      if (logsRes.ok) {
        const d = await logsRes.json();
        if (d.auditLogs) setAuditLogs(d.auditLogs);
      }
    } catch (err) {
      console.warn('Failed loading admin data:', err);
    }
  }, [authFetch]);

  // Validate active session on initial load
  useEffect(() => {
    let isMounted = true;

    async function validateCurrentSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            if (isMounted) {
              setCurrentUser(data.user);
              setIsAuthenticated(true);
              setToken(storedToken);
            }
          } else {
            localStorage.removeItem(TOKEN_KEY);
            if (isMounted) {
              setToken(null);
              setCurrentUser(null);
              setIsAuthenticated(false);
            }
          }
        } else {
          localStorage.removeItem(TOKEN_KEY);
          if (isMounted) {
            setToken(null);
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.warn('Session verification network error, clearing stale token', err);
        localStorage.removeItem(TOKEN_KEY);
        if (isMounted) {
          setToken(null);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    validateCurrentSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch admin data whenever authenticated user changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      refreshAdminData();
    }
  }, [isAuthenticated, currentUser, refreshAdminData]);

  // Login handler
  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Invalid credentials.' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      setIsLoading(false);

      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Network connection failed.' };
    }
  };

  // Logout handler
  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.warn('Logout API notification error', err);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  // Refresh current user profile
  const refreshUser = async (): Promise<void> => {
    try {
      const res = await authFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (err) {
      console.error('Failed refreshing current user profile', err);
    }
  };

  // Change Password
  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update password.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  // Reset Password
  const resetPassword = async (identifier: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to reset password.' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  // Permission evaluation functions
  const hasRole = (roles: string | string[]): boolean => {
    if (!currentUser) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.some(
      r =>
        r.toUpperCase() === currentUser.roleCode.toUpperCase() ||
        r.toUpperCase() === currentUser.role.toUpperCase()
    );
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.roleCode === 'SUPER_ADMIN') return true;
    return (currentUser.permissions || []).includes(permissionCode);
  };

  const hasProjectAccess = (projectIdOrCode: string, requiredLevel: 'VIEW' | 'EDIT' | 'FULL' = 'VIEW'): boolean => {
    if (!currentUser) return false;
    if (currentUser.roleCode === 'SUPER_ADMIN' || currentUser.hasAllProjectAccess) return true;

    const matched = (currentUser.assignedProjects || []).find(
      p =>
        p.projectId === projectIdOrCode ||
        p.projectCode.trim().toLowerCase() === projectIdOrCode.trim().toLowerCase()
    );

    if (!matched || matched.accessLevel === 'NO_ACCESS') return false;
    if (requiredLevel === 'VIEW') return true;
    if (requiredLevel === 'EDIT') return matched.accessLevel === 'EDIT' || matched.accessLevel === 'FULL';
    if (requiredLevel === 'FULL') return matched.accessLevel === 'FULL';
    return false;
  };

  const getUserProjectLevel = (projectIdOrCode: string): ProjectAccessLevel => {
    if (!currentUser) return 'NO_ACCESS';
    if (currentUser.roleCode === 'SUPER_ADMIN' || currentUser.hasAllProjectAccess) return 'FULL';

    const matched = (currentUser.assignedProjects || []).find(
      p =>
        p.projectId === projectIdOrCode ||
        p.projectCode.trim().toLowerCase() === projectIdOrCode.trim().toLowerCase()
    );

    return matched ? matched.accessLevel : 'NO_ACCESS';
  };

  const getAuthorizedProjects = (allProjects: any[]): any[] => {
    if (!currentUser) return [];
    if (currentUser.roleCode === 'SUPER_ADMIN' || currentUser.hasAllProjectAccess) {
      return allProjects;
    }

    const assignedCodes = new Set(
      (currentUser.assignedProjects || [])
        .filter(p => p.accessLevel !== 'NO_ACCESS')
        .map(p => p.projectCode.trim().toLowerCase())
    );
    const assignedIds = new Set(
      (currentUser.assignedProjects || [])
        .filter(p => p.accessLevel !== 'NO_ACCESS')
        .map(p => p.projectId)
    );

    return allProjects.filter(prj => {
      const code = (prj.PROJECT_CODE || prj.code || prj.id || '').trim().toLowerCase();
      const id = prj.id || prj.PROJECT_ID || '';
      return assignedCodes.has(code) || assignedIds.has(id);
    });
  };

  // User Management Actions
  const createUser = async (userData: any): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create user.' };
      }
      await refreshAdminData();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const updateUser = async (userId: string, updates: Partial<AuthUser>): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const res = await authFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update user.' };
      }
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(data.user);
      }
      await refreshAdminData();
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const toggleUserStatus = async (userId: string, newStatus: UserStatus): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update status.' };
      }
      await refreshAdminData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const updateUserProjects = async (userId: string, projects: UserProjectAccess[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch(`/api/admin/users/${userId}/projects`, {
        method: 'PUT',
        body: JSON.stringify({ assignedProjects: projects })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update project assignments.' };
      }
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(data.user);
      }
      await refreshAdminData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const updateRolePermissions = async (roleCode: string, permissions: string[]): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch(`/api/admin/roles/${roleCode}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to update permissions.' };
      }
      await refreshAdminData();
      await refreshUser();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const createRole = async (role: Omit<Role, 'id'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/admin/roles', {
        method: 'POST',
        body: JSON.stringify(role)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create role.' };
      }
      await refreshAdminData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const createDepartment = async (dept: Omit<Department, 'id'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/admin/departments', {
        method: 'POST',
        body: JSON.stringify(dept)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create department.' };
      }
      await refreshAdminData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const createPosition = async (pos: Omit<Position, 'id'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/admin/positions', {
        method: 'POST',
        body: JSON.stringify(pos)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to create position.' };
      }
      await refreshAdminData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteUser = async (userId: string, adminPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ adminPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to delete user account.' };
      }
      await refreshAdminData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const deleteMultipleUsers = async (userIds: string[], adminPassword: string): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const res = await authFetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ userIds, adminPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to delete selected users.' };
      }
      await refreshAdminData();
      return { success: true, count: data.count };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const purgeUserDirectory = async (adminPassword: string, mode: 'RESET_DEFAULTS' | 'PURGE_ALL_EXCEPT_CURRENT' = 'RESET_DEFAULTS'): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const res = await authFetch('/api/admin/users/purge-directory', {
        method: 'POST',
        body: JSON.stringify({ adminPassword, mode })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to purge user directory.' };
      }
      await refreshAdminData();
      return { success: true, count: data.count };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error.' };
    }
  };

  const logAuditAction = async (action: {
    action: string;
    module: string;
    recordType: string;
    recordId?: string;
    projectId?: string;
    description: string;
  }): Promise<void> => {
    try {
      await authFetch('/api/admin/audit-logs', {
        method: 'POST',
        body: JSON.stringify(action)
      });
    } catch (err) {
      console.warn('Audit logging failed silently:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        isLoading,
        token,
        login,
        logout,
        refreshUser,
        changePassword,
        resetPassword,
        hasRole,
        hasPermission,
        hasProjectAccess,
        getUserProjectLevel,
        getAuthorizedProjects,
        allUsers,
        allRoles,
        allPermissions,
        allDepartments,
        allPositions,
        auditLogs,
        refreshAdminData,
        createUser,
        updateUser,
        toggleUserStatus,
        updateUserProjects,
        updateRolePermissions,
        createRole,
        createDepartment,
        createPosition,
        deleteUser,
        deleteMultipleUsers,
        purgeUserDirectory,
        logAuditAction
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
