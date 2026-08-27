import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Role } from '../types';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { UserCheck, UserPlus } from 'lucide-react';
import CreateAccountModal from '../components/Staff/CreateAccountModal';

export default function Staff() {
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { userData, isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (!isAdmin) {
      return toast.error("Only Administrators can change roles.");
    }
    if (newRole === 'SUPER_ADMIN' && !isSuperAdmin) {
      return toast.error("Only Super Admins can grant Super Admin privileges.");
    }
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success("Account role updated successfully");
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      toast.success(`Account ${newStatus.toLowerCase()}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const activeStaff = staff.filter(user => user.status !== 'PENDING_APPROVAL' && user.status !== 'REJECTED');

  const StaffTable = ({ users, title }: { users: User[], title: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{title} ({users.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Staff Member</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact & Dept</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role Approval</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  No {title.toLowerCase()} found.
                </td>
              </tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{user.name}</span>
                    <span className="text-[10px] text-slate-500">{user.staffId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-900 font-medium">{user.department}</span>
                    <span className="text-[10px] text-slate-500">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    disabled={!isAdmin || user.id === userData?.id || (!isSuperAdmin && user.role === 'SUPER_ADMIN')}
                    className="block w-full rounded border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs py-1.5"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="NURSE">Nurse</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="ADMISSION_OFFICER">Admission Officer</option>
                    <option value="BED_MANAGER">Bed Manager</option>
                    <option value="ADMIN">Administrator</option>
                    {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                    user.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                  )}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                  {user.status === 'ACTIVE' ? (
                    <button 
                      onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                      disabled={user.id === userData?.id || (!isSuperAdmin && user.role === 'SUPER_ADMIN')}
                      className="text-red-600 hover:text-red-900 disabled:opacity-30"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                      disabled={user.id === userData?.id || (!isSuperAdmin && user.role === 'SUPER_ADMIN')}
                      className="text-emerald-600 hover:text-emerald-900 disabled:opacity-30"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administrator Database</h1>
          <p className="text-sm text-slate-500 mt-1">Approve pending staff accounts and manage system privileges</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 shadow-sm transition-colors text-sm font-medium shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Provision Account
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <StaffTable users={activeStaff} title="Active Staff Directory" />
      )}

      <CreateAccountModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
