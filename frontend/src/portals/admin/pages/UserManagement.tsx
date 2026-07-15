import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, ShieldCheck, History, User as UserIcon } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [activeTab, setActiveTab] = useState("All Users");

  // Add User Form state
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
    
    if (searchQuery) params.search = searchQuery;
    
    if (statusFilter === "Active") params.is_active = "true";
    else if (statusFilter === "Suspended") params.is_active = "false";
    
    if (roleFilter !== "All Roles") {
      params.role = roleFilter.toLowerCase();
    }

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
  }, [searchQuery, statusFilter, roleFilter, activeTab]);

  const handleToggleStatus = async (user: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.users.update(user.id, { is_active: !user.is_active });
      loadUsers();
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_active: !user.is_active });
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
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
    setSelectedUser("new");
  };

  const handleCreateUser = async () => {
    if (!formEmail || !formPassword) {
      alert("Email and password are required.");
      return;
    }
    
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
    } catch (err: any) {
      alert(err.message || "Failed to create user.");
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedUser || selectedUser === 'new') return;
    
    const payload: any = {
      is_active: selectedUser.is_active,
    };

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
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to save user changes.");
    }
  };

  const handleOpenDetail = (user: any) => {
    setSelectedUser(user);
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-[#f9f9f7]">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 shrink-0 space-y-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-sans font-extrabold text-primary">User Management</h2>
          <p className="mt-1 text-sm text-on-surface-variant font-medium">Keep clients, farmers, suppliers, and staff aligned.</p>
        </div>
        
        <div className="flex border-b border-outline-variant">
          {['All Users', 'Clients', 'Farmers & Suppliers'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-bold transition-all border-b-2",
                activeTab === tab ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:bg-surface-container-low"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

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
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface-variant outline-none"
            >
              <option value="All Roles">Role: All Roles</option>
              <option value="Farmer">Farmer</option>
              <option value="Client">Client</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <button 
            onClick={handleOpenAddUser}
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-container transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="h-full min-h-0 bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="p-8 text-center text-on-surface-variant font-medium">Loading user data...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant font-medium">No users found.</div>
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
                  {users.map((user) => (
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
                        <div 
                          onClick={(e) => handleToggleStatus(user, e)}
                          className={cn(
                            "w-8 h-4 rounded-full relative transition-colors cursor-pointer",
                            user.is_active ? "bg-primary" : "bg-outline-variant"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                            user.is_active ? "left-[17px]" : "left-[3px]"
                          )} />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[13px] text-on-surface-variant">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <DetailDrawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={selectedUser === 'new' ? "Add New User" : "Record Details"}
        subtitle={selectedUser && selectedUser !== 'new' ? `${selectedUser.email} • Role: ${selectedUser.role}` : 'Create a client or farmer account'}
        footer={
          selectedUser === 'new' ? (
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleCreateUser}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-bold shadow-sm hover:brightness-110 transition-all"
              >
                Create User
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-6 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-3 w-full">
              <button 
                onClick={handleSaveChanges}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-bold shadow-sm hover:brightness-110 transition-all"
              >
                Save Changes
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-6 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all"
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
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Username</label>
              <input 
                type="text" 
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="username"
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Password</label>
              <input 
                type="password" 
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="password (min 8 chars)"
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Role</label>
              <select 
                value={formRole} 
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
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
                <h4 className="font-bold text-sm text-primary">Profile Information</h4>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    {formRole === 'farmer' ? 'Farm Name' : 'Business Name'}
                  </label>
                  <input 
                    type="text" 
                    value={formProfileName}
                    onChange={(e) => setFormProfileName(e.target.value)}
                    placeholder="Valley Organics"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Phone</label>
                  <input 
                    type="text" 
                    value={formProfilePhone}
                    onChange={(e) => setFormProfilePhone(e.target.value)}
                    placeholder="+1 (555) 234-8891"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    {formRole === 'farmer' ? 'Location' : 'Delivery Address'}
                  </label>
                  <input 
                    type="text" 
                    value={formProfileAddress}
                    onChange={(e) => setFormProfileAddress(e.target.value)}
                    placeholder="Oregon, USA"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        ) : selectedUser ? (
          <div className="space-y-8">
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

            <section>
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-primary" />
                <h4 className="font-bold">User & Profile Information</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    {selectedUser.role === 'farmer' ? 'Farm Name' : 'Business Name'}
                  </label>
                  <input 
                    type="text" 
                    value={formProfileName}
                    onChange={(e) => setFormProfileName(e.target.value)}
                    placeholder="Not Set"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">Phone Number</label>
                  <input 
                    type="text" 
                    value={formProfilePhone}
                    onChange={(e) => setFormProfilePhone(e.target.value)}
                    placeholder="Not Set"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-1 uppercase">
                    {selectedUser.role === 'farmer' ? 'Location' : 'Delivery Address'}
                  </label>
                  <input 
                    type="text" 
                    value={formProfileAddress}
                    onChange={(e) => setFormProfileAddress(e.target.value)}
                    placeholder="Not Set"
                    className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
