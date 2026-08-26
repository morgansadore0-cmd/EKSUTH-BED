import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User, Role } from '../types';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, UserX, CheckCircle, XCircle } from 'lucide-react';

export default function PendingApprovals() {
  const [pendingStaff, setPendingStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { userData, isAdmin, isSuperAdmin } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'PENDING'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPendingStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRoleSelection = (userId: string, role: Role) => {
    setSelectedRoles(prev => ({ ...prev, [userId]: role }));
  };

  const handleApprove = async (userId: string) => {
    const newRole = selectedRoles[userId];
    if (!newRole || newRole === 'PENDING' || newRole === 'REJECTED') {
      return toast.error("Please select a valid role to approve this user.");
    }

    if (!isAdmin) {
      return toast.error("Only Administrators can approve accounts.");
    }
    
    if (newRole === 'SUPER_ADMIN' && !isSuperAdmin) {
      return toast.error("Only Super Admins can grant Super Admin privileges.");
    }
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast.success("Account approved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve account");
    }
  };

  const handleReject = async (userId: string) => {
    if (!isAdmin) {
      return toast.error("Only Administrators can reject accounts.");
    }

    if (window.confirm("Are you sure you want to reject this registration request? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        toast.success("Registration request rejected and removed.");
      } catch (error) {
        console.error(error);
        toast.error("Failed to reject registration request");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-600" />
          Pending Approvals
        </h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve new staff account registration requests.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Awaiting Action ({pendingStaff.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Applicant Details</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact & Dept</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Registration Date</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assign Role</th>
                  <th className="px-6 py-3 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pendingStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-emerald-300 mb-3" />
                        <p className="font-medium text-slate-700">No pending approvals</p>
                        <p className="text-xs text-slate-500 mt-1">All staff registration requests have been processed.</p>
                      </div>
                    </td>
                  </tr>
                ) : pendingStaff.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{user.name}</span>
                        <span className="text-[10px] text-slate-500">ID: {user.staffId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-900 font-medium">{user.department}</span>
                        <span className="text-[10px] text-slate-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={selectedRoles[user.id] || ''} 
                        onChange={(e) => handleRoleSelection(user.id, e.target.value as Role)}
                        className="block w-full min-w-[140px] rounded border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-xs py-1.5 bg-white"
                      >
                        <option value="" disabled>Select Role...</option>
                        <option value="VIEWER">Viewer</option>
                        <option value="NURSE">Nurse</option>
                        <option value="DOCTOR">Doctor</option>
                        <option value="ADMISSION_OFFICER">Admission Officer</option>
                        <option value="BED_MANAGER">Bed Manager</option>
                        <option value="ADMIN">Administrator</option>
                        {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleReject(user.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded shadow-sm transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(user.id)}
                          disabled={!selectedRoles[user.id]}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-transparent text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
