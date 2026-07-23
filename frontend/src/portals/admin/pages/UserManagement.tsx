import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, MoreVertical, ShieldCheck, User as UserIcon, AlertCircle, Trash2, Power, CheckCircle, XCircle, Eye } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface UserManagementProps {
  searchTerm?: string;
}

export function UserManagement({ searchTerm = '' }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("All Users");

  // Farmer Applications state
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Actions dropdown state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Submission loading states
  const [isSaving, setIsSaving] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmColor?: string;
    hideCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm'
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, any>>({});

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // User Form state
  const [formEmail, setFormEmail] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("client");
  const [formIsActive, setFormIsActive] = useState(true);
  
  // Profile sub-form
  const [formProfileName, setFormProfileName] = useState("");
  const [formProfilePhone, setFormProfilePhone] = useState("");
  const [formProfileAddress, setFormProfileAddress] = useState("");

  const loadUsers = () => {
    setIsLoading(true);
    const params: Record<string, string> = {};
    
    const activeSearch = searchTerm || searchQuery;
    if (activeSearch) params.search = activeSearch;
    
    if (statusFilter === "Active") params.is_active = "true";
    else if (statusFilter === "Suspended") params.is_active = "false";
    
    if (activeTab === "Clients") {
      params.role = "client";
    } else if (activeTab === "Farmers & Suppliers") {
      params.role = "farmer";
    }

    api.users.list(params)
      .then(res => {
        setUsers(res || []);
      })
      .catch(err => {
        console.error("Failed to fetch users:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery, statusFilter, activeTab, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, activeTab, searchTerm]);

  const loadApplications = () => {
    setAppsLoading(true);
    api.farmerApplications.list()
      .then(res => setApplications(res?.results || res || []))
      .catch(err => console.error('Failed to load farmer applications:', err))
      .finally(() => setAppsLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'Applications') {
      loadApplications();
    }
  }, [activeTab]);

  const handleApproveApplication = (app: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Farmer Application',
      message: `Approve ${app.full_name}'s application for ${app.farm_name}? A farmer account will be created automatically.`,
      confirmText: 'Approve',
      confirmColor: 'bg-primary',
      onConfirm: async () => {
        try {
          const result = await api.farmerApplications.approve(app.id);
          loadApplications();
          if (result?.temporary_password) {
            setConfirmDialog({
              isOpen: true,
              title: 'Farmer Account Created',
              message: `Account created successfully!\n\nUsername: ${result.username}\nTemporary Password: ${result.temporary_password}\n\nPlease share these credentials with the farmer securely.`,
              confirmText: 'OK',
              confirmColor: 'bg-primary',
              hideCancel: true,
              onConfirm: () => {}
            });
          }
        } catch (err: any) {
          setConfirmDialog({
            isOpen: true,
            title: 'Error',
            message: err.message || 'Failed to approve application.',
            confirmText: 'Close',
            confirmColor: 'bg-red-600',
            hideCancel: true,
            onConfirm: () => {}
          });
        }
      }
    });
  };

  const handleRejectApplication = (app: any) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reject Farmer Application',
      message: `Reject ${app.full_name}'s application? This action cannot be undone.`,
      confirmText: 'Reject',
      confirmColor: 'bg-red-600',
      onConfirm: async () => {
        try {
          await api.farmerApplications.reject(app.id);
          loadApplications();
        } catch (err: any) {
          console.error('Reject failed:', err);
        }
      }
    });
  };

  const handleToggleStatus = (user: any) => {
    const actionText = user.is_active ? 'deactivate' : 'activate';
    setOpenMenuId(null);
    setConfirmDialog({
      isOpen: true,
      title: `${user.is_active ? 'Deactivate' : 'Activate'} User`,
      message: `Are you sure you want to ${actionText} the account for ${user.email}?`,
      confirmText: user.is_active ? 'Deactivate' : 'Activate',
      confirmColor: user.is_active ? 'bg-red-600' : 'bg-primary',
      onConfirm: async () => {
        try {
          await api.users.update(user.id, { is_active: !user.is_active });
          loadUsers();
          if (selectedUser?.id === user.id) {
            setSelectedUser({ ...selectedUser, is_active: !user.is_active });
          }
        } catch (err) {
          console.error("Failed to toggle status:", err);
        }
      }
    });
  };

  const handleDeleteUser = (user: any) => {
    setOpenMenuId(null);
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete User',
      message: `Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmColor: 'bg-red-600',
      onConfirm: async () => {
        try {
          await api.users.delete(user.id);
          if (selectedUser?.id === user.id) setSelectedUser(null);
          loadUsers();
        } catch (err) {
          console.error("Failed to delete user:", err);
        }
      }
    });
  };

  const handleOpenAddUser = () => {
    setFormEmail("");
    setFormUsername("");
    setFormPassword("");
    setFormRole("client");
    setFormIsActive(true);
    setFormProfileName("");
    setFormProfilePhone("");
    setFormProfileAddress("");
    setValidationErrors({});
    setSelectedUser("new");
  };

  const handleCreateUser = async () => {
    if (!formEmail || !formPassword) {
      setConfirmDialog({
        isOpen: true,
        title: "Required Fields",
        message: "Email and password are required.",
        confirmText: "OK",
        confirmColor: "bg-primary",
        hideCancel: true,
        onConfirm: () => {}
      });
      return;
    }
    
    setIsSaving(true);
    setValidationErrors({});
    const payload: any = {
      email: formEmail,
      username: formUsername || formEmail.split('@')[0],
      password: formPassword,
      role: formRole,
      is_active: formIsActive,
    };

    if (formRole === 'farmer') {
      payload.farmer_profile = {
        farm_name: formProfileName,
        phone: formProfilePhone,
        location: formProfileAddress
      };
    } else if (formRole === 'client') {
      payload.client_profile = {
        business_name: formProfileName,
        phone: formProfilePhone,
        delivery_address: formProfileAddress
      };
    }

    try {
      await api.users.create(payload);
      setSelectedUser(null);
      loadUsers();
      
      setConfirmDialog({
        isOpen: true,
        title: "User Created Successfully",
        message: `The user account for ${formEmail} has been successfully created.`,
        confirmText: "OK",
        confirmColor: "bg-primary",
        hideCancel: true,
        onConfirm: () => {}
      });
    } catch (err: any) {
      if (err.fields) {
        setValidationErrors(err.fields);
      } else {
        setConfirmDialog({
          isOpen: true,
          title: "Error Creating User",
          message: err.message || "Failed to create user.",
          confirmText: "Close",
          confirmColor: "bg-red-600",
          hideCancel: true,
          onConfirm: () => {}
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedUser || selectedUser === 'new') return;
    
    setIsSaving(true);
    setValidationErrors({});
    const payload: any = {
      is_active: selectedUser.is_active,
    };

    if (formPassword) {
      payload.password = formPassword;
    }

    if (selectedUser.role === 'farmer') {
      payload.farmer_profile = {
        farm_name: formProfileName,
        phone: formProfilePhone,
        location: formProfileAddress
      };
    } else if (selectedUser.role === 'client') {
      payload.client_profile = {
        business_name: formProfileName,
        phone: formProfilePhone,
        delivery_address: formProfileAddress
      };
    }

    try {
      await api.users.update(selectedUser.id, payload);
      setFormPassword("");
      setSelectedUser(null);
      loadUsers();

      setConfirmDialog({
        isOpen: true,
        title: "Changes Saved",
        message: `Profile modifications for ${selectedUser.email} have been successfully saved.`,
        confirmText: "OK",
        confirmColor: "bg-primary",
        hideCancel: true,
        onConfirm: () => {}
      });
    } catch (err: any) {
      if (err.fields) {
        setValidationErrors(err.fields);
      } else {
        setConfirmDialog({
          isOpen: true,
          title: "Error Saving Changes",
          message: err.message || "Failed to save user changes.",
          confirmText: "Close",
          confirmColor: "bg-red-600",
          hideCancel: true,
          onConfirm: () => {}
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDetail = (user: any) => {
    setSelectedUser(user);
    setFormPassword("");
    setValidationErrors({});
    if (user.role === 'farmer') {
      setFormProfileName(user.farmer_profile?.farm_name || "");
      setFormProfilePhone(user.farmer_profile?.phone || "");
      setFormProfileAddress(user.farmer_profile?.location || "");
    } else if (user.role === 'client') {
      setFormProfileName(user.client_profile?.business_name || "");
      setFormProfilePhone(user.client_profile?.phone || "");
      setFormProfileAddress(user.client_profile?.delivery_address || "");
    } else {
      setFormProfileName("");
      setFormProfilePhone("");
      setFormProfileAddress("");
    }
  };

  // Pagination calculations
  const usersPerPage = 8;
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f9f9f7]">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0 space-y-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary">User Management</h2>
          <p className="mt-1 text-sm text-on-surface-variant font-medium">Keep clients, farmers, suppliers, and staff aligned.</p>
        </div>
        
        <div className="flex border-b border-outline-variant">
          {['All Users', 'Clients', 'Farmers & Suppliers', 'Applications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-bold transition-all border-b-2 cursor-pointer",
                activeTab === tab ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:bg-surface-container-low"
              )}
            >
              {tab}{tab === 'Applications' && applications.filter(a => a.status === 'pending').length > 0 ? ` (${applications.filter(a => a.status === 'pending').length})` : ''}
            </button>
          ))}
        </div>

        {activeTab !== 'Applications' && (
        <div className="py-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none min-w-[280px]"
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface-variant outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <button 
            onClick={handleOpenAddUser}
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-container transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
        )}
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="h-full min-h-0 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">

            {/* ── APPLICATIONS TAB ── */}
            {activeTab === 'Applications' ? (
              appsLoading ? (
                <div className="p-12 text-center text-on-surface-variant font-medium animate-pulse">Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
                  <AlertCircle className="w-8 h-8 opacity-40 text-primary mb-2" />
                  <p className="text-sm font-bold">No farmer applications yet.</p>
                  <p className="text-xs">Applications submitted via the farmer registration form will appear here.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Farm</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {applications.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="hover:bg-surface-container-high/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                              {app.full_name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-on-surface">{app.full_name}</p>
                              <p className="text-xs text-on-surface-variant">{app.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-on-surface">{app.farm_name}</p>
                          <p className="text-xs text-on-surface-variant">{app.crops}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-on-surface-variant">{app.location}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 text-[10px] font-bold rounded-full border",
                            app.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            app.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedApp(app)}
                              title="View details"
                              className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {app.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveApplication(app)}
                                  title="Approve"
                                  className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600 cursor-pointer"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectApplication(app)}
                                  title="Reject"
                                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500 cursor-pointer"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
            // ── USERS TABS ──
            isLoading ? (
              <div className="p-12 text-center text-on-surface-variant font-medium animate-pulse">Loading user data...</div>
            ) : users.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center text-on-surface-variant">
                <AlertCircle className="w-8 h-8 opacity-40 text-primary mb-2" />
                <p className="text-sm font-bold">No users match your criteria.</p>
                <p className="text-xs">Try broadening your search term or filter rules.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date Joined</th>
                    <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {currentUsers.map((user) => (
                    <tr 
                      key={user.id}
                      onClick={() => handleOpenDetail(user)}
                      className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant">
                            {user.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{user.username || user.email}</p>
                            <p className="text-xs text-on-surface-variant">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-bold rounded-full uppercase tracking-tighter">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-full border",
                          user.is_active 
                             ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                             : "bg-red-50 text-red-700 border-red-200"
                        )}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[13px] text-on-surface-variant">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block" ref={openMenuId === user.id ? menuRef : undefined}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === user.id ? null : user.id); }}
                            className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === user.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden min-w-[180px] animate-in fade-in slide-in-from-top-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
                              >
                                <Power className="w-3.5 h-3.5" />
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <div className="border-t border-outline-variant/30" />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
          </div>

          {/* Pagination Footer */}
          {activeTab !== 'Applications' && !isLoading && totalPages > 1 && (
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between shrink-0">
              <span className="text-xs text-on-surface-variant font-bold">
                Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, users.length)} of {users.length} users
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-bold bg-white text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-bold bg-white text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DetailDrawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser === 'new' ? "Add New User" : "User Profile Details"}
        subtitle={selectedUser && selectedUser !== 'new' ? `${selectedUser.email} • Role: ${selectedUser.role}` : 'Create a client, farmer, or admin account'}
        footer={
          selectedUser === 'new' ? (
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleCreateUser}
                disabled={isSaving}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-bold shadow-sm hover:brightness-110 transition-all cursor-pointer disabled:opacity-75"
              >
                {isSaving ? 'Creating...' : 'Create User'}
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                disabled={isSaving}
                className="px-6 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-bold shadow-sm hover:brightness-110 transition-all cursor-pointer disabled:opacity-75"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                disabled={isSaving}
                className="px-6 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selectedUser === 'new' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Email Address</label>
              <input 
                type="email" 
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="name@company.com"
                className={cn(
                  "w-full px-3 py-2 bg-white border rounded-lg text-sm outline-none",
                  validationErrors.email ? "border-red-500" : "border-outline-variant"
                )}
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-semibold">{validationErrors.email[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Username</label>
              <input 
                type="text" 
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="username"
                className={cn(
                  "w-full px-3 py-2 bg-white border rounded-lg text-sm outline-none",
                  validationErrors.username ? "border-red-500" : "border-outline-variant"
                )}
              />
              {validationErrors.username && (
                <p className="mt-1 text-xs text-red-600 font-semibold">{validationErrors.username[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Password</label>
              <input 
                type="password" 
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="password (min 8 chars)"
                className={cn(
                  "w-full px-3 py-2 bg-white border rounded-lg text-sm outline-none",
                  validationErrors.password ? "border-red-500" : "border-outline-variant"
                )}
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs text-red-600 font-semibold">{validationErrors.password[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Role</label>
              <select 
                value={formRole} 
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none"
              >
                <option value="client">Client</option>
                <option value="farmer">Farmer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-2 py-2">
              <input 
                type="checkbox" 
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary"
              />
              <span className="text-sm font-semibold">Active Account</span>
            </div>

            {(formRole === 'farmer' || formRole === 'client') && (
              <div className="pt-4 border-t border-outline-variant space-y-4">
                <h4 className="font-bold text-sm text-primary">Profile Information (Rwanda Localized)</h4>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    {formRole === 'farmer' ? 'Farm Name' : 'Business Name'}
                  </label>
                  <input 
                    type="text" 
                    value={formProfileName}
                    onChange={(e) => setFormProfileName(e.target.value)}
                    placeholder="e.g. Kigali Farms Ltd / Nyagatare Milk Coop"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Phone</label>
                  <input 
                    type="text" 
                    value={formProfilePhone}
                    onChange={(e) => setFormProfilePhone(e.target.value)}
                    placeholder="e.g. +250 788 123 456"
                    className={cn(
                      "w-full px-3 py-2 bg-white border rounded-lg text-sm outline-none",
                      (validationErrors.phone || validationErrors.farmer_profile?.phone || validationErrors.client_profile?.phone) ? "border-red-500" : "border-outline-variant"
                    )}
                  />
                  {(validationErrors.phone || validationErrors.farmer_profile?.phone || validationErrors.client_profile?.phone) && (
                    <p className="mt-1 text-xs text-red-600 font-semibold font-sans">
                      {validationErrors.phone?.[0] || validationErrors.farmer_profile?.phone?.[0] || validationErrors.client_profile?.phone?.[0]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    {formRole === 'farmer' ? 'Location' : 'Delivery Address'}
                  </label>
                  <input 
                    type="text" 
                    value={formProfileAddress}
                    onChange={(e) => setFormProfileAddress(e.target.value)}
                    placeholder="e.g. Gasabo, Kigali, Rwanda / Musanze, Northern Province"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        ) : selectedUser ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    checked={selectedUser.is_active} 
                    onChange={(e) => setSelectedUser({ ...selectedUser, is_active: e.target.checked })} 
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-semibold">{selectedUser.is_active ? 'Active' : 'Suspended'}</span>
                </div>
              </div>
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Registered</p>
                <p className="text-md font-bold text-primary mt-1">
                  {new Date(selectedUser.date_joined).toLocaleDateString()}
                </p>
              </div>
            </div>

            <section className="pt-2">
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-primary" />
                <h4 className="font-bold">User & Profile Information (Rwanda Localized)</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase font-mono">Username</label>
                  <input 
                    type="text" 
                    value={selectedUser.username || ''}
                    disabled
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none text-on-surface-variant opacity-60"
                  />
                </div>
                {(selectedUser.role === 'farmer' || selectedUser.role === 'client') && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                        {selectedUser.role === 'farmer' ? 'Farm Name' : 'Business Name'}
                      </label>
                      <input 
                        type="text" 
                        value={formProfileName}
                        onChange={(e) => setFormProfileName(e.target.value)}
                        placeholder="Not Set"
                        className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Phone Number</label>
                      <input 
                        type="text" 
                        value={formProfilePhone}
                        onChange={(e) => setFormProfilePhone(e.target.value)}
                        placeholder="e.g. +250 788 123 456"
                        className={cn(
                          "w-full px-3 py-2 bg-white border rounded-lg text-sm outline-none",
                          (validationErrors.phone || validationErrors.farmer_profile?.phone || validationErrors.client_profile?.phone) ? "border-red-500" : "border-outline-variant"
                        )}
                      />
                      {(validationErrors.phone || validationErrors.farmer_profile?.phone || validationErrors.client_profile?.phone) && (
                        <p className="mt-1 text-xs text-red-600 font-semibold font-sans">
                          {validationErrors.phone?.[0] || validationErrors.farmer_profile?.phone?.[0] || validationErrors.client_profile?.phone?.[0]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                        {selectedUser.role === 'farmer' ? 'Location' : 'Delivery Address'}
                      </label>
                      <input 
                        type="text" 
                        value={formProfileAddress}
                        onChange={(e) => setFormProfileAddress(e.target.value)}
                        placeholder="e.g. Gasabo, Kigali, Rwanda"
                        className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="pt-6 border-t border-outline-variant/30">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h4 className="font-bold">Security (Force Update Password)</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">New Password</label>
                  <input 
                    type="password" 
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter new password to reset"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </DetailDrawer>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedApp(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-outline-variant/50 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-primary">Farmer Application</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">Review applicant details before approval</p>
              </div>
              <span className={cn(
                "px-3 py-1 text-xs font-bold rounded-full border",
                selectedApp.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                selectedApp.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                "bg-red-50 text-red-700 border-red-200"
              )}>
                {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
              </span>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: selectedApp.full_name },
                  { label: 'Email', value: selectedApp.email },
                  { label: 'Phone', value: selectedApp.phone || '—' },
                  { label: 'Farm Name', value: selectedApp.farm_name },
                  { label: 'Farm Location', value: selectedApp.location },
                  { label: 'Crops', value: selectedApp.crops },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
              {selectedApp.certifications && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Certifications</p>
                  <p className="text-sm text-on-surface">{selectedApp.certifications}</p>
                </div>
              )}
              {selectedApp.description && (
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-on-surface leading-relaxed">{selectedApp.description}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Date Applied</p>
                <p className="text-sm text-on-surface">{selectedApp.created_at ? new Date(selectedApp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
              </div>
            </div>
            <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center gap-3 justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Close
              </button>
              {selectedApp.status === 'pending' && (
                <>
                  <button
                    onClick={() => { setSelectedApp(null); handleRejectApplication(selectedApp); }}
                    className="px-4 py-2 border border-red-200 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => { setSelectedApp(null); handleApproveApplication(selectedApp); }}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-sm"
                  >
                    Approve & Create Account
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Premium Confirm Dialog Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-outline-variant/50 transform scale-100 transition-all space-y-4">
            <h3 className="text-lg font-extrabold text-primary">{confirmDialog.title}</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              {!confirmDialog.hideCancel && (
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold text-white shadow-md hover:opacity-90 transition-all cursor-pointer",
                  confirmDialog.confirmColor || "bg-primary"
                )}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

