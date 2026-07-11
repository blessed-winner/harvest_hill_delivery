import React, { useState } from 'react';
import { Search, Filter, Plus, MoreVertical, ShieldCheck, History, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { DetailDrawer } from './DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const mockUsers: User[] = [
  {
    id: 'FRM-8821',
    name: 'Silas Thorne',
    email: 'silas.thorne@valleyagri.com',
    role: 'FARMER',
    status: 'active',
    dateJoined: 'Oct 12, 2022',
    lastActive: '2 hours ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'STF-1022',
    name: 'Elena Aris',
    email: 'e.aris@harvestlogistics.co',
    role: 'STAFF',
    status: 'active',
    dateJoined: 'Jan 05, 2023',
    lastActive: '15 mins ago'
  },
  {
    id: 'SUP-4491',
    name: 'Marcus Vane',
    email: 'm.vane@greenport.io',
    role: 'SUPPLIER',
    status: 'suspended',
    dateJoined: 'Mar 22, 2023',
    lastActive: '3 days ago',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200'
  }
];

export function UserManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 pt-6 shrink-0">
        <h2 className="text-2xl font-extrabold text-primary mb-6">User Management</h2>
        
        <div className="flex border-b border-outline-variant">
          {['All Users', 'Clients', 'Farmers & Suppliers', 'Staff'].map((tab, i) => (
            <button
              key={tab}
              className={cn(
                "px-6 py-3 text-sm font-bold transition-all border-b-2",
                i === 0 ? "text-primary border-primary" : "text-on-surface-variant border-transparent hover:bg-surface-container-low"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Search by name or email..."
                className="pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none min-w-[280px]"
              />
            </div>
            <select className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface-variant outline-none">
              <option>Status: All</option>
              <option>Active</option>
              <option>Suspended</option>
            </select>
            <select className="px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface-variant outline-none">
              <option>Role: All Roles</option>
              <option>Farmer</option>
              <option>Staff</option>
              <option>Supplier</option>
            </select>
          </div>
          <button className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-container transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="h-full bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                {mockUsers.map((user) => (
                  <tr 
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img src={user.avatar} className="w-9 h-9 rounded-full object-cover border border-outline-variant" alt="" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center font-bold text-on-surface-variant">
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-on-surface">{user.name}</p>
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
                      <div className={cn(
                        "w-8 h-4 rounded-full relative transition-colors cursor-pointer",
                        user.status === 'active' ? "bg-primary" : "bg-outline-variant"
                      )}>
                        <div className={cn(
                          "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                          user.status === 'active' ? "left-[17px]" : "left-[3px]"
                        )} />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[13px] text-on-surface-variant">{user.dateJoined}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-surface-container-low flex justify-between items-center border-t border-outline-variant">
            <span className="text-xs text-on-surface-variant">Showing 1 to {mockUsers.length} of 48 users</span>
            <div className="flex gap-1">
              {['Prev', '1', '2', '3', 'Next'].map((p, i) => (
                <button
                  key={p}
                  className={cn(
                    "px-3 py-1 rounded text-xs transition-colors",
                    i === 1 ? "bg-primary text-white" : "bg-white border border-outline-variant hover:bg-surface-container-high"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DetailDrawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Record Details"
        subtitle={selectedUser ? `${selectedUser.name} • ${selectedUser.role} ID: #${selectedUser.id}` : ''}
        footer={
          <div className="flex gap-3">
            <button className="flex-1 bg-primary text-white py-3 rounded-lg font-bold shadow-sm hover:brightness-110 transition-all">Save Changes</button>
            <button className="px-6 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-high transition-all">Discard</button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Total Supply</p>
                <p className="text-xl font-bold text-primary mt-1">1,248 Tons</p>
              </div>
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Active Contracts</p>
                <p className="text-xl font-bold text-primary mt-1">12 Pending</p>
              </div>
            </div>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <UserIcon className="w-5 h-5 text-primary" />
                <h4 className="font-bold">User Information</h4>
              </div>
              <div className="space-y-3">
                {[
                  ['Full Name', selectedUser.name],
                  ['Email Address', selectedUser.email],
                  ['Primary Phone', '+1 (555) 234-8891'],
                  ['Region', 'Northern Valley, Sector 4'],
                ].map(([label, val]) => (
                  <div key={label} className="grid grid-cols-3 text-sm">
                    <span className="text-on-surface-variant">{label}</span>
                    <span className="col-span-2 font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h4 className="font-bold">Permissions & Access</h4>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl space-y-3">
                {[
                  'Can Create Supply Notes',
                  'View Market Pricing',
                  'Direct Bank Payouts',
                ].map((p, i) => (
                  <div key={p} className="flex justify-between items-center text-sm">
                    <span>{p}</span>
                    <input type="checkbox" checked={i < 2} className="rounded border-outline-variant text-primary focus:ring-primary" readOnly />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-primary" />
                <h4 className="font-bold">Recent Activity</h4>
              </div>
              <div className="relative border-l-2 border-outline-variant/30 ml-3 pl-6 space-y-6">
                {[
                  { title: 'Updated Supply Volume', desc: "Changed 'Organic Barley' stock from 400t to 550t.", time: 'TODAY • 10:45 AM', color: 'bg-primary' },
                  { title: 'System Login', desc: 'Logged in via Mobile Portal (iOS 16.4).', time: 'YESTERDAY • 09:12 AM', color: 'bg-outline-variant' },
                ].map((act, i) => (
                  <div key={i} className="relative">
                    <div className={cn("absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-4 border-white", act.color)} />
                    <p className="text-sm font-bold leading-tight">{act.title}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{act.desc}</p>
                    <p className="text-[10px] text-outline font-bold mt-1 uppercase">{act.time}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
